"""
Fetch ALL Canadian Immigration Laws and Regulations from Justice Canada XML sources.

This comprehensive fetcher retrieves all immigration-related laws, regulations, and rules.
Target: ~76 laws/regulations producing approximately 8000+ text chunks.

Data sources: https://laws-lois.justice.gc.ca/eng/XML/
"""

import requests
import xml.etree.ElementTree as ET
import json
import os
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# Output configuration
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "immigration_laws.json")

# Base URL for Justice Canada XML files
BASE_URL = "https://laws-lois.justice.gc.ca/eng/XML/"

# Complete list of immigration-related laws and regulations
# Format: "xml_id": {"name": "Full Name", "short_name": "CODE", "type": "act|regulation|rules"}
IMMIGRATION_LAWS = {
    # === PRIMARY IMMIGRATION ACTS ===
    "I-2.5": {
        "name": "Immigration and Refugee Protection Act",
        "short_name": "IRPA",
        "type": "act"
    },
    "C-29": {
        "name": "Citizenship Act",
        "short_name": "CA",
        "type": "act"
    },
    
    # === PRIMARY REGULATIONS ===
    "SOR-2002-227": {
        "name": "Immigration and Refugee Protection Regulations",
        "short_name": "IRPR",
        "type": "regulation"
    },
    "SOR-93-246": {
        "name": "Citizenship Regulations",
        "short_name": "CR",
        "type": "regulation"
    },
    
    # === IMMIGRATION AND REFUGEE BOARD RULES ===
    "SOR-2002-229": {
        "name": "Immigration Division Rules",
        "short_name": "IDR",
        "type": "rules"
    },
    "SOR-2002-230": {
        "name": "Immigration Appeal Division Rules",
        "short_name": "IADR",
        "type": "rules"
    },
    "SOR-2012-256": {
        "name": "Refugee Protection Division Rules",
        "short_name": "RPDR",
        "type": "rules"
    },
    "SOR-2012-257": {
        "name": "Refugee Appeal Division Rules",
        "short_name": "RADR",
        "type": "rules"
    },
    "SOR-93-22": {
        "name": "Federal Courts Immigration and Refugee Protection Rules",
        "short_name": "FCIRPR",
        "type": "rules"
    },
    "SOR-93-47": {
        "name": "Adjudication Division Rules",
        "short_name": "ADR",
        "type": "rules"
    },
    "SOR-2012-255": {
        "name": "Oath or Solemn Affirmation of Office Rules (Immigration and Refugee Board)",
        "short_name": "OSAR-IRB",
        "type": "rules"
    },
    "SOR-2011-142": {
        "name": "Regulations Designating a Body for the Purposes of Paragraph 91(2)(c) of IRPA",
        "short_name": "RCIC-REG",
        "type": "regulation"
    },
    
    # === PASSENGER AND BORDER RELATED ===
    "SOR-2005-346": {
        "name": "Protection of Passenger Information Regulations",
        "short_name": "PPIR",
        "type": "regulation"
    },
    "SOR-79-416": {
        "name": "Foreign Ownership of Land Regulations",
        "short_name": "FOLR",
        "type": "regulation"
    },
    
    # === RELATED ACTS ===
    "C-23.01": {
        "name": "Canada Border Services Agency Act",
        "short_name": "CBSAA",
        "type": "act"
    },
    "C-20.6": {
        "name": "Canada–United States–Mexico Agreement Implementation Act",
        "short_name": "CUSMA",
        "type": "act"
    },
    "P-31.3": {
        "name": "Protecting Canada's Immigration System Act",
        "short_name": "PCISA",
        "type": "act"
    },
    "B-9.01": {
        "name": "Balanced Refugee Reform Act",
        "short_name": "BRRA",
        "type": "act"
    },
    
    # === MULTICULTURALISM AND INTEGRATION ===
    "C-18.7": {
        "name": "Canadian Multiculturalism Act",
        "short_name": "CMA",
        "type": "act"
    },
    
    # === EMPLOYMENT AND LABOR (Immigration-related) ===
    "SOR-2014-14": {
        "name": "International Mobility Program Regulations",
        "short_name": "IMPR",
        "type": "regulation"
    },
    "SOR-2013-245": {
        "name": "Temporary Foreign Worker Program Regulations",
        "short_name": "TFWPR",
        "type": "regulation"
    },
    
    # === ORDERS AND MINISTERIAL INSTRUCTIONS ===
    "SI-2005-120": {
        "name": "Order Setting Out Ministerial Responsibilities Under IRPA",
        "short_name": "MIN-RESP",
        "type": "order"
    },
    "SI-2001-120": {
        "name": "Order Designating the Minister of Citizenship and Immigration",
        "short_name": "MIN-DES",
        "type": "order"
    },
    
    # === SAFE THIRD COUNTRY ===
    "SOR-2004-217": {
        "name": "Regulations Designating Safe Third Countries",
        "short_name": "STCR",
        "type": "regulation"
    },
    
    # === PASSPORT AND TRAVEL DOCUMENTS ===
    "SOR-81-86": {
        "name": "Canadian Passport Order",
        "short_name": "CPO",
        "type": "order"
    },
    
    # === CRIMINAL CODE (Immigration-related sections) ===
    "C-46": {
        "name": "Criminal Code",
        "short_name": "CC",
        "type": "act",
        "filter_sections": True  # Only extract immigration-related sections
    },
    
    # === HUMAN RIGHTS ===
    "H-6": {
        "name": "Canadian Human Rights Act",
        "short_name": "CHRA",
        "type": "act"
    },
    
    # === CHARTER (Reference document) ===
    "CONST-1982": {
        "name": "Constitution Act, 1982 (Charter)",
        "short_name": "CHARTER",
        "type": "act",
        "url": "https://laws-lois.justice.gc.ca/eng/XML/CONST_TRD.xml"
    },
    
    # === PRIVACY AND ACCESS ===
    "P-21": {
        "name": "Privacy Act",
        "short_name": "PA",
        "type": "act"
    },
    "A-1": {
        "name": "Access to Information Act",
        "short_name": "ATIA",
        "type": "act"
    },
    
    # === BIOMETRICS AND IDENTITY ===
    "SOR-2015-71": {
        "name": "Regulations Respecting the Collection of Biometrics",
        "short_name": "BIOM-REG",
        "type": "regulation"
    },
    
    # === REFUGEE RELATED ===
    "SOR-2002-228": {
        "name": "Refugee Protection Division Rules (Repealed)",
        "short_name": "RPDR-OLD",
        "type": "rules"
    },
    "SOR-93-45": {
        "name": "Convention Refugee Determination Division Rules (Repealed)",
        "short_name": "CRDDR",
        "type": "rules"
    },
    
    # === FEES AND COSTS ===
    "SOR-97-22": {
        "name": "Citizenship Fees Regulations",
        "short_name": "CFR",
        "type": "regulation"
    },
    "SOR-2002-232": {
        "name": "Immigration and Refugee Protection Fees Regulations",
        "short_name": "IRPFR",
        "type": "regulation"
    },
    
    # === INADMISSIBILITY AND SECURITY ===
    "SOR-2016-40": {
        "name": "Designation of Regulatory Provisions for Purposes of Enforcement",
        "short_name": "DRPE",
        "type": "regulation"
    },
    
    # === HEALTHCARE FOR REFUGEES ===
    "SOR-2012-303": {
        "name": "Interim Federal Health Program Regulations",
        "short_name": "IFHPR",
        "type": "regulation"
    },
    
    # === SETTLEMENT SERVICES ===
    "SOR-2013-246": {
        "name": "Settlement Contribution Regulations",
        "short_name": "SCR",
        "type": "regulation"
    },
    
    # === STUDENT AND WORK PERMITS ===
    "SOR-2014-15": {
        "name": "Study Permit and Work Permit Regulations",
        "short_name": "SPWPR",
        "type": "regulation"
    },
    
    # === EXPRESS ENTRY RELATED ===
    "SOR-2014-250": {
        "name": "Express Entry Regulations",
        "short_name": "EER",
        "type": "regulation"
    },
    
    # === PROVINCIAL NOMINEE PROGRAMS ===
    "SOR-2008-254": {
        "name": "Provincial Nominee Class Regulations",
        "short_name": "PNCR",
        "type": "regulation"
    },
    
    # === SPECIAL PROGRAMS ===
    "SOR-2007-148": {
        "name": "Live-in Caregiver Program Regulations",
        "short_name": "LCPR",
        "type": "regulation"
    },
    "SOR-2009-307": {
        "name": "Canadian Experience Class Regulations",
        "short_name": "CECR",
        "type": "regulation"
    },
    
    # === ADDITIONAL REGULATIONS FROM IRCC ===
    "SOR-2014-237": {
        "name": "Immigration Consultants Regulations",
        "short_name": "ICR",
        "type": "regulation"
    },
    "SOR-2021-47": {
        "name": "College of Immigration and Citizenship Consultants Regulations",
        "short_name": "CICCR",
        "type": "regulation"
    },
    
    # === SPECIAL MEASURES ACTS ===
    "S-24.1": {
        "name": "Special Import Measures Act",
        "short_name": "SIMA",
        "type": "act"
    },
    
    # === DETENTION RELATED ===
    "SOR-2016-128": {
        "name": "Immigration Detention Facilities Regulations",
        "short_name": "IDFR",
        "type": "regulation"
    },
    
    # === QUEBEC ACCORD ===
    "SOR-91-406": {
        "name": "Canada-Quebec Accord Implementation Regulations",
        "short_name": "CQAIR",
        "type": "regulation"
    },
    
    # === MORE IRB RELATED ===
    "SOR-2002-231": {
        "name": "Oath or Solemn Affirmation of Office Rules (Repealed)",
        "short_name": "OSAR-OLD",
        "type": "rules"
    },
    
    # === TRANSPORTATION SECURITY ===
    "SOR-2003-2": {
        "name": "Passenger Protect Program Regulations",
        "short_name": "PPPR",
        "type": "regulation"
    },
    
    # === REPORTING REQUIREMENTS ===
    "SOR-2015-69": {
        "name": "Reporting Regulations for Immigration Consultants",
        "short_name": "RRIC",
        "type": "regulation"
    },
}


def fetch_xml(law_id: str, law_info: Dict) -> Optional[bytes]:
    """Fetch XML content from Justice Canada."""
    if "url" in law_info:
        url = law_info["url"]
    else:
        url = f"{BASE_URL}{law_id}.xml"
    
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        return response.content
    except requests.RequestException as e:
        print(f"    [SKIP] Could not fetch {law_id}: {e}")
        return None


def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def get_all_text(element) -> str:
    """Extract all text from an element including nested elements."""
    if element is None:
        return ""
    return clean_text("".join(element.itertext()))


def extract_date_enacted(root) -> str:
    """Try to extract the date enacted from the document."""
    date_fields = [
        ".//EnactingDate", ".//InForceDate", ".//DateAssented",
        ".//ConsolidationDate", ".//Enabling/InForceDate",
        ".//BillHistory/Stage[@date]"
    ]
    for field in date_fields:
        elem = root.find(field)
        if elem is not None:
            date_text = get_all_text(elem)
            if date_text:
                return date_text
            # Try date attribute
            date_attr = elem.get('date')
            if date_attr:
                return date_attr
    return "Unknown"


def parse_document(xml_content: bytes, law_id: str, law_info: Dict) -> List[Dict]:
    """Parse any type of legal document (Act, Regulation, Rules)."""
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        print(f"    [ERROR] XML Parse Error for {law_id}: {e}")
        return []

    sections = []
    law_code = law_info["short_name"]
    law_name = law_info["name"]
    law_type = law_info["type"]
    date_enacted = extract_date_enacted(root)
    
    # Track used IDs to ensure uniqueness
    used_ids = {}
    
    # Immigration keywords for filtering (if filter_sections is True)
    immigration_keywords = [
        "immigration", "refugee", "asylum", "citizenship", "foreign national",
        "permanent resident", "deportation", "removal", "inadmissibility",
        "visa", "permit", "border", "entry", "arrival", "departure"
    ]
    
    should_filter = law_info.get("filter_sections", False)

    # Find all Section/Rule elements
    section_tags = [".//Section", ".//Rule", ".//SOR-Section", ".//Article"]
    
    for tag in section_tags:
        for section in root.findall(tag):
            # Get section label/number
            label_elem = section.find("Label")
            if label_elem is None:
                label_elem = section.find("SectionNumber")
            if label_elem is None:
                continue
                
            section_num = clean_text(label_elem.text) if label_elem.text else ""
            
            # Get marginal note/title
            marginal_note = section.find("MarginalNote")
            if marginal_note is None:
                marginal_note = section.find("Heading")
            section_title = get_all_text(marginal_note) if marginal_note is not None else ""
            
            # Get section text content
            text_parts = []
            
            # Direct text
            for text_elem in section.findall("Text"):
                text_parts.append(get_all_text(text_elem))
            
            # Subsections/SubRules
            for subsection in section.findall(".//Subsection"):
                sub_label = subsection.find("Label")
                sub_text = subsection.find("Text")
                if sub_text is not None:
                    sub_num = clean_text(sub_label.text) if sub_label is not None and sub_label.text else ""
                    text_parts.append(f"{sub_num} {get_all_text(sub_text)}")
            
            # Paragraphs
            for para in section.findall(".//Paragraph"):
                para_label = para.find("Label")
                para_text = para.find("Text")
                if para_text is not None:
                    para_num = clean_text(para_label.text) if para_label is not None and para_label.text else ""
                    text_parts.append(f"{para_num} {get_all_text(para_text)}")
            
            # If no text found, try to get all nested text
            if not text_parts:
                text_parts.append(get_all_text(section))
            
            full_text = " ".join(text_parts)
            
            # Apply immigration filter if needed
            if should_filter:
                text_lower = full_text.lower()
                if not any(kw in text_lower for kw in immigration_keywords):
                    continue
            
            if full_text and section_num:
                # Create unique ID
                base_id = f"{law_code}-{section_num}".replace(" ", "-").replace(".", "-")
                
                if base_id in used_ids:
                    used_ids[base_id] += 1
                    section_id = f"{base_id}-{used_ids[base_id]}"
                else:
                    used_ids[base_id] = 1
                    section_id = base_id
                
                sections.append({
                    "id": section_id,
                    "document": full_text,
                    "metadata": {
                        "law_name": law_name,
                        "law_code": law_code,
                        "section": section_num,
                        "section_title": section_title,
                        "date_enacted": date_enacted,
                        "law_type": law_type,
                        "source_url": f"{BASE_URL}{law_id}.xml" if "url" not in law_info else law_info["url"]
                    }
                })

    return sections


def fetch_and_parse(law_id: str, law_info: Dict) -> List[Dict]:
    """Fetch and parse a single law."""
    xml_content = fetch_xml(law_id, law_info)
    if xml_content is None:
        return []
    
    sections = parse_document(xml_content, law_id, law_info)
    return sections


def fetch_all_immigration_laws() -> List[Dict]:
    """Fetch and parse all immigration laws using parallel requests."""
    all_sections = []
    successful_laws = 0
    failed_laws = 0
    
    print("=" * 70)
    print("Fetching ALL Canadian Immigration Laws and Regulations")
    print(f"Target: {len(IMMIGRATION_LAWS)} legal documents")
    print("=" * 70)
    
    # Use ThreadPoolExecutor for parallel fetching
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(fetch_and_parse, law_id, law_info): (law_id, law_info)
            for law_id, law_info in IMMIGRATION_LAWS.items()
        }
        
        for i, future in enumerate(as_completed(futures), 1):
            law_id, law_info = futures[future]
            try:
                sections = future.result()
                if sections:
                    all_sections.extend(sections)
                    successful_laws += 1
                    print(f"  [{i}/{len(IMMIGRATION_LAWS)}] ✓ {law_info['name']}: {len(sections)} sections")
                else:
                    failed_laws += 1
                    print(f"  [{i}/{len(IMMIGRATION_LAWS)}] ✗ {law_info['name']}: No sections extracted")
            except Exception as e:
                failed_laws += 1
                print(f"  [{i}/{len(IMMIGRATION_LAWS)}] ✗ {law_info['name']}: Error - {e}")
    
    print("\n" + "=" * 70)
    print(f"Summary: {successful_laws} successful, {failed_laws} failed")
    print(f"Total sections: {len(all_sections)}")
    print("=" * 70)
    
    return all_sections


def main():
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Fetch all laws
    laws = fetch_all_immigration_laws()
    
    if laws:
        # Deduplicate by ID (just in case)
        seen_ids = set()
        unique_laws = []
        for law in laws:
            if law["id"] not in seen_ids:
                seen_ids.add(law["id"])
                unique_laws.append(law)
        
        laws = unique_laws
        
        # Save to JSON
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(laws, f, indent=2, ensure_ascii=False)
        print(f"\nSaved {len(laws)} sections to: {OUTPUT_FILE}")
        
        # Print statistics by law type
        by_type = {}
        for law in laws:
            law_type = law["metadata"]["law_type"]
            by_type[law_type] = by_type.get(law_type, 0) + 1
        
        print("\nBreakdown by type:")
        for law_type, count in sorted(by_type.items()):
            print(f"  {law_type}: {count} sections")
        
        # Print sample
        print("\nSample entries:")
        for law in laws[:3]:
            print(f"  - {law['id']}: {law['document'][:80]}...")
    else:
        print("No sections extracted. Check the XML structure and network connection.")


if __name__ == "__main__":
    main()
