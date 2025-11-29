"""
Fetch Hansard Parliamentary Debates from the House of Commons.

Uses XML exports when available, falls back to HTML scraping.
Focuses on immigration-related debates.

Data source: https://www.ourcommons.ca/DocumentViewer/
"""

import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import json
import os
import re
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from textblob import TextBlob
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# Output configuration
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "hansard_debates.json")

# Base URL for Our Commons
BASE_URL = "https://www.ourcommons.ca"

# Parliament sessions to scrape (recent ones with immigration debates)
# Format: (parliament, session, start_sitting, end_sitting)
SESSIONS = [
    ("44", "1", 1, 350),   # 44th Parliament, 1st Session - current
    ("43", "2", 1, 100),   # 43rd Parliament, 2nd Session
    ("43", "1", 1, 100),   # 43rd Parliament, 1st Session
    ("42", "1", 1, 50),    # 42nd Parliament, 1st Session
]

# Immigration-related keywords for filtering
IMMIGRATION_KEYWORDS = [
    "immigration", "immigrant", "immigrants", "immigrer",
    "refugee", "refugees", "réfugié", "asylum", "asile",
    "citizenship", "citizen", "citoyenneté", "citoyen",
    "visa", "visas",
    "ircc", "irpa", "irpr",
    "deportation", "removal order", "expulsion", "renvoi",
    "permanent resident", "résident permanent", "pr card",
    "temporary resident", "résident temporaire", 
    "work permit", "permis de travail",
    "study permit", "permis d'études",
    "family reunification", "réunification familiale", "sponsorship", "parrainage",
    "express entry", "entrée express",
    "border", "frontière", "cbsa", "asfc",
    "inadmissibility", "inadmissible", "interdiction de territoire",
    "foreign worker", "travailleur étranger",
    "newcomer", "nouvel arrivant",
    "minister of immigration", "ministre de l'immigration",
    "safe third country", "tiers pays sûr"
]


def calculate_sentiment(text: str) -> float:
    """Calculate sentiment score using TextBlob (-1.0 to 1.0)."""
    try:
        blob = TextBlob(text)
        return round(blob.sentiment.polarity, 3)
    except:
        return 0.0


def is_immigration_related(text: str) -> bool:
    """Check if text is related to immigration."""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in IMMIGRATION_KEYWORDS)


def fetch_hansard_xml(parliament: str, session: str, sitting: int) -> Optional[bytes]:
    """Fetch Hansard XML for a specific sitting."""
    # Try different URL patterns
    url_patterns = [
        f"{BASE_URL}/Content/House/{parliament}{session}/Debates/{sitting:03d}/HAN{sitting:03d}-E.XML",
        f"{BASE_URL}/DocumentViewer/en/{parliament}-{session}/house/sitting-{sitting}/hansard/xml",
        f"{BASE_URL}/Content/House/{parliament}{session}/Debates/{sitting}/HAN{sitting}-E.XML",
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/xml, text/xml, */*"
    }
    
    for url in url_patterns:
        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200 and response.content:
                # Verify it's XML
                if b'<?xml' in response.content[:100] or b'<Hansard' in response.content[:500]:
                    return response.content
        except requests.RequestException:
            continue
    
    return None


def fetch_hansard_html(parliament: str, session: str, sitting: int) -> Optional[str]:
    """Fetch Hansard HTML page for a specific sitting."""
    url = f"{BASE_URL}/DocumentViewer/en/{parliament}-{session}/house/sitting-{sitting}/hansard"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            return response.text
    except requests.RequestException:
        pass
    
    return None


def parse_hansard_xml(xml_content: bytes, parliament: str, session: str, sitting: int) -> List[Dict]:
    """Parse Hansard XML to extract interventions."""
    debates = []
    
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError:
        return []
    
    # Get date from XML - try multiple patterns
    date_elem = root.find(".//ExtractedItem[@Name='Date']")
    if date_elem is None:
        date_elem = root.find(".//SittingDate")
    if date_elem is None:
        date_elem = root.find(".//Date")
    sitting_date = date_elem.text.strip() if date_elem is not None and date_elem.text else "Unknown"
    
    # Find all interventions - the XML structure uses Intervention tags
    for intervention in root.findall(".//Intervention"):
        # Extract speaker info from PersonSpeaking
        person_speaking = intervention.find(".//PersonSpeaking")
        if person_speaking is None:
            continue
        
        # Get speaker name from Affiliation
        affiliation = person_speaking.find(".//Affiliation")
        speaker_name = "Unknown"
        party = "Unknown"
        constituency = ""
        
        if affiliation is not None:
            # Get name parts
            first_name = affiliation.find(".//FirstName")
            last_name = affiliation.find(".//LastName")
            
            if first_name is not None and first_name.text and last_name is not None and last_name.text:
                speaker_name = f"{first_name.text.strip()} {last_name.text.strip()}"
            else:
                # Try getting from text
                name_text = "".join(affiliation.itertext()).strip()
                if name_text:
                    speaker_name = name_text
            
            # Get party from Type attribute or nested element
            party_attr = affiliation.get("Type", "")
            if party_attr:
                party = party_attr
            else:
                party_elem = affiliation.find(".//PoliticalAffiliation")
                if party_elem is not None and party_elem.text:
                    party = party_elem.text.strip()
            
            # Get constituency
            riding = affiliation.find(".//Riding")
            if riding is not None and riding.text:
                constituency = riding.text.strip()
        
        # Get speech text from all Content/ParaText elements
        text_parts = []
        for content in intervention.findall(".//Content"):
            for para in content.findall(".//ParaText"):
                para_text = "".join(para.itertext()).strip()
                if para_text:
                    text_parts.append(para_text)
        
        # If no Content found, try direct ParaText
        if not text_parts:
            for para in intervention.findall(".//ParaText"):
                para_text = "".join(para.itertext()).strip()
                if para_text:
                    text_parts.append(para_text)
        
        speech_text = " ".join(text_parts)
        speech_text = re.sub(r'\s+', ' ', speech_text).strip()
        
        # Skip short interventions
        if len(speech_text) < 100:
            continue
        
        # Check if immigration-related
        if not is_immigration_related(speech_text):
            continue
        
        # Get topic/subject from parent or sibling elements
        topic = "General Debate"
        subject = intervention.find(".//SubjectOfBusiness")
        if subject is not None:
            topic_title = subject.find(".//Title")
            if topic_title is not None and topic_title.text:
                topic = topic_title.text.strip()
        
        # Try to get topic from OrderOfBusiness parent
        parent = intervention.find("..")
        if parent is not None:
            heading = parent.find(".//Heading")
            if heading is not None:
                heading_text = "".join(heading.itertext()).strip()
                if heading_text:
                    topic = heading_text
        
        # Calculate sentiment
        sentiment = calculate_sentiment(speech_text)
        
        # Normalize party names
        party = normalize_party(party)
        
        debates.append({
            "id": str(uuid.uuid4()),
            "document": speech_text,
            "metadata": {
                "speaker_name": speaker_name,
                "party": party,
                "constituency": constituency,
                "date": sitting_date,
                "topic": topic,
                "sentiment_score": sentiment,
                "source_url": f"{BASE_URL}/DocumentViewer/en/{parliament}-{session}/house/sitting-{sitting}/hansard",
                "parliament_session": f"{parliament}-{session}",
                "sitting": sitting
            }
        })
    
    return debates


def parse_hansard_html(html_content: str, parliament: str, session: str, sitting: int) -> List[Dict]:
    """Parse Hansard HTML to extract interventions."""
    debates = []
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Get date from page
    date_elem = soup.find('time') or soup.find(class_=re.compile(r'date', re.I))
    sitting_date = date_elem.get_text(strip=True) if date_elem else "Unknown"
    
    # Find intervention blocks - various possible structures
    interventions = soup.find_all(['div', 'section'], class_=re.compile(r'intervention|speech|statement|hansard', re.I))
    
    if not interventions:
        # Try alternative structure - look for speaker names followed by text
        interventions = soup.find_all('div', {'data-intervention': True})
    
    if not interventions:
        # Look for paragraphs with speaker info
        all_paragraphs = soup.find_all('p')
        current_speaker = None
        current_party = None
        current_text = []
        
        for p in all_paragraphs:
            # Check if this is a speaker line
            speaker_match = re.match(r'^((?:Hon\.|Mr\.|Mrs\.|Ms\.|M\.)\s+[\w\s-]+)\s*\(([^)]+)\)', p.get_text(strip=True))
            
            if speaker_match:
                # Save previous speaker's text if any
                if current_speaker and current_text:
                    full_text = " ".join(current_text)
                    if is_immigration_related(full_text) and len(full_text) > 100:
                        # Parse party from affiliation text
                        affiliation = speaker_match.group(2)
                        party_match = re.search(r'(Lib\.|CPC|NDP|BQ|GP|Green)', affiliation, re.I)
                        party = party_match.group(1) if party_match else "Unknown"
                        
                        debates.append({
                            "id": str(uuid.uuid4()),
                            "document": full_text,
                            "metadata": {
                                "speaker_name": current_speaker,
                                "party": normalize_party(party),
                                "date": sitting_date,
                                "topic": "Parliamentary Debate",
                                "sentiment_score": calculate_sentiment(full_text),
                                "source_url": f"{BASE_URL}/DocumentViewer/en/{parliament}-{session}/house/sitting-{sitting}/hansard",
                                "parliament_session": f"{parliament}-{session}",
                                "sitting": sitting
                            }
                        })
                
                current_speaker = speaker_match.group(1).strip()
                current_text = []
            else:
                text = p.get_text(strip=True)
                if text and current_speaker:
                    current_text.append(text)
    
    # Process structured interventions if found
    for intervention in interventions:
        # Try to find speaker name
        speaker_elem = intervention.find(['span', 'a', 'strong'], class_=re.compile(r'speaker|member|name|person', re.I))
        if not speaker_elem:
            speaker_elem = intervention.find(['a'], href=re.compile(r'/members/', re.I))
        
        speaker_name = speaker_elem.get_text(strip=True) if speaker_elem else "Unknown"
        
        # Parse speaker name and party from format like "Mr. John Doe (Toronto, Lib.)"
        name_party_match = re.match(r'^((?:Hon\.|Mr\.|Mrs\.|Ms\.|M\.)\s*[\w\s-]+)\s*\(([^)]+)\)', speaker_name)
        if name_party_match:
            speaker_name = name_party_match.group(1).strip()
            affiliation = name_party_match.group(2)
            party_match = re.search(r'(Lib\.|Liberal|CPC|Conservative|NDP|BQ|Bloc|GP|Green)', affiliation, re.I)
            party = party_match.group(1) if party_match else "Unknown"
        else:
            party = "Unknown"
        
        # Get speech text
        text_elem = intervention.find(['div', 'p'], class_=re.compile(r'text|content|speech', re.I))
        if text_elem:
            speech_text = text_elem.get_text(strip=True)
        else:
            # Get all paragraph text
            paragraphs = intervention.find_all('p')
            speech_text = " ".join(p.get_text(strip=True) for p in paragraphs)
        
        speech_text = re.sub(r'\s+', ' ', speech_text).strip()
        
        # Skip short or non-immigration related
        if len(speech_text) < 100 or not is_immigration_related(speech_text):
            continue
        
        debates.append({
            "id": str(uuid.uuid4()),
            "document": speech_text,
            "metadata": {
                "speaker_name": speaker_name,
                "party": normalize_party(party),
                "date": sitting_date,
                "topic": "Parliamentary Debate",
                "sentiment_score": calculate_sentiment(speech_text),
                "source_url": f"{BASE_URL}/DocumentViewer/en/{parliament}-{session}/house/sitting-{sitting}/hansard",
                "parliament_session": f"{parliament}-{session}",
                "sitting": sitting
            }
        })
    
    return debates


def normalize_party(party: str) -> str:
    """Normalize party names to standard format."""
    # Handle numeric party IDs from Hansard XML
    party_id_map = {
        "1": "Bloc Québécois",
        "2": "Conservative",
        "4": "NDP",
        "9": "Green Party",
        "15": "Independent",
        "18": "Liberal",
        "60056": "Independent",
        "92": "Independent",
        "93": "Independent",
        "96": "Independent",
    }
    
    # Try numeric ID first
    party_stripped = party.strip()
    if party_stripped in party_id_map:
        return party_id_map[party_stripped]
    
    # Handle text party names
    party_map = {
        "lib": "Liberal", "lib.": "Liberal", "liberal": "Liberal",
        "cpc": "Conservative", "con": "Conservative", "con.": "Conservative", "conservative": "Conservative",
        "ndp": "NDP", "n.d.p.": "NDP", "new democratic": "NDP",
        "bq": "Bloc Québécois", "bloc": "Bloc Québécois", "bloc québécois": "Bloc Québécois",
        "gp": "Green Party", "green": "Green Party", "pvc": "Green Party",
        "ind": "Independent", "ind.": "Independent", "independent": "Independent"
    }
    
    party_lower = party.lower().strip()
    return party_map.get(party_lower, party)


def fetch_sitting(args) -> List[Dict]:
    """Fetch and parse a single sitting."""
    parliament, session, sitting = args
    
    # Try XML first
    xml_content = fetch_hansard_xml(parliament, session, sitting)
    if xml_content:
        debates = parse_hansard_xml(xml_content, parliament, session, sitting)
        if debates:
            return debates
    
    # Fall back to HTML
    html_content = fetch_hansard_html(parliament, session, sitting)
    if html_content:
        debates = parse_hansard_html(html_content, parliament, session, sitting)
        if debates:
            return debates
    
    return []


def fetch_all_hansard_debates() -> List[Dict]:
    """Fetch Hansard debates from multiple sessions."""
    all_debates = []
    
    print("=" * 70)
    print("Fetching Hansard Parliamentary Debates")
    print("Focus: Immigration-related discussions")
    print("=" * 70)
    
    # Build list of sittings to fetch
    sittings_to_fetch = []
    for parliament, session, start, end in SESSIONS:
        # Sample sittings to avoid overwhelming the server
        # Focus on more recent sittings which are more likely to have immigration debates
        step = max(1, (end - start) // 30)  # Get about 30 sittings per session
        for sitting in range(end, start - 1, -step):  # Start from most recent
            sittings_to_fetch.append((parliament, session, sitting))
    
    print(f"\nWill check {len(sittings_to_fetch)} sittings across {len(SESSIONS)} sessions")
    
    # Use ThreadPoolExecutor for parallel fetching
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(fetch_sitting, args): args
            for args in sittings_to_fetch
        }
        
        processed = 0
        for future in as_completed(futures):
            args = futures[future]
            processed += 1
            
            try:
                debates = future.result()
                if debates:
                    all_debates.extend(debates)
                    print(f"  [{processed}/{len(sittings_to_fetch)}] {args[0]}-{args[1]} sitting {args[2]}: {len(debates)} immigration debates found")
                
                # Stop if we have enough debates
                if len(all_debates) >= 500:
                    print(f"\n  Reached target of 500+ debates")
                    break
                    
            except Exception as e:
                pass  # Silently skip errors
            
            # Be polite to the server
            time.sleep(0.2)
    
    return all_debates


def create_sample_debates() -> List[Dict]:
    """Create comprehensive sample debates for development."""
    print("\nCreating sample debate data...")
    
    sample_debates = [
        # Immigration Reform debates
        {
            "id": str(uuid.uuid4()),
            "document": "Mr. Speaker, the Immigration and Refugee Protection Act must be reformed to better serve those seeking asylum in Canada. Our current system creates unnecessary barriers for legitimate refugees while failing to address security concerns effectively. We need a system that is both compassionate and efficient, one that processes claims quickly while maintaining the highest standards of fairness. The backlog of cases has reached unacceptable levels, with some claimants waiting years for a decision. This delay causes immense hardship for families and undermines confidence in our immigration system.",
            "metadata": {
                "speaker_name": "Hon. Jane Smith",
                "party": "Liberal",
                "date": "2024-03-15",
                "topic": "Immigration Reform - Bill C-71",
                "sentiment_score": 0.25,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 250
            }
        },
        {
            "id": str(uuid.uuid4()),
            "document": "Mr. Speaker, while we support efficient immigration, we must ensure proper security screening. The proposed changes to the IRPA do not adequately address concerns about criminal inadmissibility provisions. We have seen cases where individuals with serious criminal histories have been able to enter Canada, putting Canadians at risk. The government must balance its desire to increase immigration levels with its responsibility to protect public safety. We call for strengthened background checks and more resources for CBSA officers at our borders.",
            "metadata": {
                "speaker_name": "Mr. Robert Chen",
                "party": "Conservative",
                "date": "2024-03-15",
                "topic": "Immigration Reform - Bill C-71",
                "sentiment_score": -0.15,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 250
            }
        },
        # Family Reunification
        {
            "id": str(uuid.uuid4()),
            "document": "The NDP believes that family reunification should be at the heart of our immigration policy. Current processing times of over two years for family sponsorship applications are unacceptable and cause tremendous hardship. Families are being kept apart for years while bureaucratic processes drag on. We have heard heartbreaking stories of parents unable to see their children grow up, of spouses separated for years. This is not the Canada we should be. We must invest in processing capacity and streamline applications while maintaining program integrity.",
            "metadata": {
                "speaker_name": "Ms. Marie Leblanc",
                "party": "NDP",
                "date": "2024-02-28",
                "topic": "Family Reunification",
                "sentiment_score": 0.35,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 245
            }
        },
        # Express Entry and Skilled Workers
        {
            "id": str(uuid.uuid4()),
            "document": "Mr. Speaker, the express entry system has proven effective at attracting skilled workers, but we must do more to recognize foreign credentials. Too many qualified immigrants are driving taxis when they should be practicing medicine or engineering. The current system of credential recognition is a patchwork of provincial regulations that creates unnecessary barriers. We need a national framework that respects provincial jurisdiction while ensuring that qualified professionals can contribute their skills to our economy without years of redundant training and examination.",
            "metadata": {
                "speaker_name": "Dr. Ahmed Hassan",
                "party": "Liberal",
                "date": "2024-02-15",
                "topic": "Foreign Credential Recognition",
                "sentiment_score": 0.2,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 240
            }
        },
        # Citizenship Processing
        {
            "id": str(uuid.uuid4()),
            "document": "The citizenship backlog has reached crisis levels. Over 350,000 applicants are waiting for their citizenship ceremonies, some for more than two years. This is a failure of government administration and an insult to those who have fulfilled all requirements to become Canadian citizens. These are people who have demonstrated their commitment to Canada, passed their tests, and met all legal requirements. They deserve better than to be stuck in bureaucratic limbo. The minister must explain what actions are being taken to address this unacceptable situation.",
            "metadata": {
                "speaker_name": "Mr. James Wilson",
                "party": "Conservative",
                "date": "2024-01-20",
                "topic": "Citizenship Processing Backlog",
                "sentiment_score": -0.45,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 235
            }
        },
        # Quebec Immigration
        {
            "id": str(uuid.uuid4()),
            "document": "Monsieur le Président, le Québec a des besoins uniques en matière d'immigration et doit maintenir le contrôle sur ses critères de sélection. L'Accord Canada-Québec est fondamental pour préserver notre caractère francophone tout en accueillant les nouveaux arrivants. Quebec has unique immigration needs and must maintain control over its selection criteria. The Canada-Quebec Accord is fundamental to preserving our francophone character while welcoming newcomers. We must ensure that immigrants to Quebec have the French language skills necessary to integrate into our society.",
            "metadata": {
                "speaker_name": "M. Pierre Tremblay",
                "party": "Bloc Québécois",
                "date": "2024-01-15",
                "topic": "Quebec Immigration Accord",
                "sentiment_score": 0.1,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 233
            }
        },
        # Refugee Resettlement
        {
            "id": str(uuid.uuid4()),
            "document": "We support increasing refugee resettlement targets, but IRCC must provide adequate resources to support newcomers. Settlement agencies are overwhelmed and newcomers are not receiving the support they need to integrate successfully. Housing affordability has made it nearly impossible for refugees to find adequate accommodation in major cities. Language training programs have long waitlists. Employment assistance is insufficient. If we are going to welcome refugees, we have a moral obligation to ensure they have the support needed to build successful lives in Canada.",
            "metadata": {
                "speaker_name": "Ms. Sarah Green",
                "party": "Green Party",
                "date": "2023-11-08",
                "topic": "Refugee Resettlement Support",
                "sentiment_score": 0.3,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 220
            }
        },
        # Temporary Foreign Workers
        {
            "id": str(uuid.uuid4()),
            "document": "The temporary foreign worker program requires significant reform. Reports of worker exploitation continue despite regulatory changes. We must protect vulnerable workers while meeting labor market needs. Closed work permits tie workers to specific employers, creating conditions ripe for abuse. Workers fear reporting mistreatment because deportation means losing everything they worked for. We need sector-specific open work permits, stronger enforcement of workplace standards, and pathways to permanent residence for workers who have contributed to our economy.",
            "metadata": {
                "speaker_name": "Hon. Michael Brown",
                "party": "Liberal",
                "date": "2023-10-25",
                "topic": "Temporary Foreign Worker Program Reform",
                "sentiment_score": 0.1,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 215
            }
        },
        # Border Security
        {
            "id": str(uuid.uuid4()),
            "document": "Border security and immigration enforcement must be strengthened. The Safe Third Country Agreement with the United States needs to be reviewed to address irregular crossings at unofficial points of entry. Roxham Road has become a symbol of a broken system. Thousands of individuals are circumventing our orderly immigration process by crossing between official ports of entry. While we must treat asylum seekers humanely, we cannot have a system where breaking the rules provides advantages over those who follow proper procedures.",
            "metadata": {
                "speaker_name": "Ms. Elizabeth Taylor",
                "party": "Conservative",
                "date": "2023-09-18",
                "topic": "Border Security and Safe Third Country Agreement",
                "sentiment_score": -0.25,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 205
            }
        },
        # International Students
        {
            "id": str(uuid.uuid4()),
            "document": "International students contribute billions to our economy and should have a clear pathway to permanent residence. The recent changes limiting post-graduation work permits are counterproductive and will harm our universities and colleges. These students have invested in Canadian education, learned our official languages, and understand our values. They are ideal candidates for permanent residence. Rather than restricting their opportunities, we should be creating more pathways for these graduates to remain and contribute to our country's future.",
            "metadata": {
                "speaker_name": "Mr. David Kumar",
                "party": "NDP",
                "date": "2023-08-12",
                "topic": "International Students and Immigration",
                "sentiment_score": 0.35,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 195
            }
        },
        # Immigration Levels
        {
            "id": str(uuid.uuid4()),
            "document": "Mr. Speaker, the government's immigration levels plan is ambitious, targeting 500,000 new permanent residents annually. However, we must ask whether our infrastructure can support this growth. Housing starts are not keeping pace with population growth. Healthcare systems are strained. Transit systems in major cities are overcrowded. Immigration is essential to Canada's future, but it must be managed in a way that maintains quality of life for both newcomers and existing residents. We need a more balanced approach that aligns immigration targets with our capacity to integrate newcomers.",
            "metadata": {
                "speaker_name": "Mr. Thomas Anderson",
                "party": "Conservative",
                "date": "2023-11-15",
                "topic": "Immigration Levels Plan",
                "sentiment_score": -0.1,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 222
            }
        },
        # IRCC Modernization
        {
            "id": str(uuid.uuid4()),
            "document": "The Minister of Immigration must explain the failures in IRCC's application processing system. Applicants report website crashes, lost documents, and inability to reach anyone for assistance. The department's digital modernization has been a disaster. Simple applications that should take weeks are taking months. Communication with applicants is virtually non-existent. We are spending billions on immigration processing, yet the results are getting worse, not better. Canadians and newcomers alike deserve a functional, responsive immigration department.",
            "metadata": {
                "speaker_name": "Ms. Jennifer Park",
                "party": "Conservative",
                "date": "2024-01-10",
                "topic": "IRCC Processing Failures",
                "sentiment_score": -0.5,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 230
            }
        },
        # Humanitarian Immigration
        {
            "id": str(uuid.uuid4()),
            "document": "Canada has a proud tradition of providing refuge to those fleeing persecution. From Vietnamese boat people to Syrian refugees, we have shown the world what compassion looks like. Today, with conflicts in Ukraine, Afghanistan, and elsewhere creating millions of displaced persons, Canada must continue this tradition. The special immigration measures for Ukrainians demonstrate what is possible when there is political will. We should extend similar measures to other conflict zones and increase our overall humanitarian intake.",
            "metadata": {
                "speaker_name": "Hon. Lisa Martin",
                "party": "Liberal",
                "date": "2023-12-05",
                "topic": "Humanitarian Immigration Programs",
                "sentiment_score": 0.45,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 228
            }
        },
        # Immigration Consultants
        {
            "id": str(uuid.uuid4()),
            "document": "The regulation of immigration consultants remains inadequate. Unscrupulous consultants continue to prey on vulnerable immigrants, charging excessive fees and providing poor or fraudulent advice. The College of Immigration and Citizenship Consultants needs stronger enforcement powers. Penalties for unauthorized practice must be increased. Too many families have lost their life savings to ghost consultants who disappeared after taking payment. We must protect newcomers from these predators while ensuring legitimate consultants can serve their clients effectively.",
            "metadata": {
                "speaker_name": "Mr. Richard Wong",
                "party": "NDP",
                "date": "2023-10-10",
                "topic": "Immigration Consultant Regulation",
                "sentiment_score": -0.2,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 210
            }
        },
        # Rural Immigration
        {
            "id": str(uuid.uuid4()),
            "document": "Rural and northern communities desperately need immigrants to address labor shortages and population decline. The Rural and Northern Immigration Pilot has shown promise, but more must be done. Too many newcomers settle in Toronto, Vancouver, and Montreal, while smaller communities struggle to attract and retain immigrants. We need stronger incentives for immigrants to settle in rural areas, including faster processing for those who commit to living in designated communities and better settlement services outside major urban centres.",
            "metadata": {
                "speaker_name": "Mr. Paul McCarthy",
                "party": "Liberal",
                "date": "2023-09-25",
                "topic": "Rural Immigration Strategy",
                "sentiment_score": 0.2,
                "source_url": "https://www.ourcommons.ca/sample",
                "parliament_session": "44-1",
                "sitting": 207
            }
        },
    ]
    
    return sample_debates


def main():
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Fetch debates from Parliament website
    debates = fetch_all_hansard_debates()
    
    # If scraping yielded few results, add comprehensive sample data
    if len(debates) < 50:
        print(f"\nScraping yielded {len(debates)} debates. Adding sample data for development...")
        sample_debates = create_sample_debates()
        debates.extend(sample_debates)
    
    # Deduplicate based on document content
    seen_docs = set()
    unique_debates = []
    for debate in debates:
        doc_hash = hash(debate["document"][:200])
        if doc_hash not in seen_docs:
            seen_docs.add(doc_hash)
            unique_debates.append(debate)
    
    debates = unique_debates
    
    print("\n" + "=" * 70)
    print(f"Total debates collected: {len(debates)}")
    
    if debates:
        # Save to JSON
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(debates, f, indent=2, ensure_ascii=False)
        print(f"Saved to: {OUTPUT_FILE}")
        
        # Print statistics
        parties = {}
        for d in debates:
            party = d["metadata"]["party"]
            parties[party] = parties.get(party, 0) + 1
        
        print("\nBreakdown by party:")
        for party, count in sorted(parties.items(), key=lambda x: -x[1]):
            print(f"  {party}: {count}")
        
        # Print sample
        print("\nSample entries:")
        for debate in debates[:3]:
            print(f"  - {debate['metadata']['speaker_name']} ({debate['metadata']['party']})")
            print(f"    Topic: {debate['metadata']['topic']}")
            print(f"    Sentiment: {debate['metadata']['sentiment_score']}")
            print(f"    Text: {debate['document'][:80]}...")
            print()
    else:
        print("No debates collected.")


if __name__ == "__main__":
    main()
