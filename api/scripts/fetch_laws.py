import requests
import xml.etree.ElementTree as ET
import json
import os
import re

# Constants
LAWS_XML_URL = "https://laws-lois.justice.gc.ca/eng/XML/Legis.xml"
OUTPUT_FILE = "api/data/laws_dataset.json"

def fetch_laws_xml():
    print(f"Downloading laws from {LAWS_XML_URL}...")
    try:
        response = requests.get(LAWS_XML_URL, stream=True)
        response.raise_for_status()
        return response.content
    except requests.RequestException as e:
        print(f"Error downloading XML: {e}")
        return None

def parse_laws_xml(xml_content):
    print("Parsing XML content...")
    try:
        root = ET.fromstring(xml_content)
        laws = []
        
        # Helper to extract sections from an element that contains Body
        def extract_sections(element, law_title):
            extracted = []
            # Sections can be nested in Body -> Section
            # Or Body -> Heading -> Section
            # Let's use .//Section to find all sections at any depth
            for section in element.findall(".//Section"):
                label = section.find("Label")
                text_node = section.find("Text")
                
                if label is not None and text_node is not None:
                    section_id = label.text
                    # Text might contain children like <DefinedTerm>, etc.
                    # "".join(text_node.itertext()) gets all text
                    text = "".join(text_node.itertext())
                    
                    extracted.append({
                        "id": f"IMM-{section_id}", 
                        "document": text,
                        "metadata": {
                            "law_name": law_title,
                            "section": section_id,
                            "date_enacted": "Unknown" 
                        }
                    })
            return extracted

        # Case 1: Root is Statute (e.g. I-2.5.xml)
        if root.tag == "Statute":
            # Try to find title
            title = "Unknown Act"
            # Usually in Identification -> Title or ShortTitle
            ident = root.find("Identification")
            if ident is not None:
                short_title = ident.find("ShortTitle")
                long_title = ident.find("LongTitle")
                if short_title is not None:
                    title = short_title.text
                elif long_title is not None:
                    title = long_title.text
            
            print(f"Parsing Statute: {title}")
            laws.extend(extract_sections(root, title))

        # Case 2: Root contains Acts (e.g. Legis.xml)
        else:
            for act in root.findall(".//Act"): 
                title_node = act.find("Title")
                if title_node is not None and "Immigration" in title_node.text:
                    law_name = title_node.text
                    print(f"Found relevant act: {law_name}")
                    laws.extend(extract_sections(act, law_name))
        
        return laws

    except ET.ParseError as e:
        print(f"Error parsing XML: {e}")
        return []

def debug_xml_structure(xml_content):
    try:
        root = ET.fromstring(xml_content)
        print(f"Root tag: {root.tag}")
        for child in list(root)[:5]:
            print(f"Child tag: {child.tag}, Attrib: {child.attrib}")
            
        # Check for Body/Section structure
        body = root.find(".//Body")
        if body is not None:
            print("Found Body tag")
            section = body.find(".//Section")
            if section is not None:
                print(f"Found Section tag: {section.tag}")
                print(f"Section children: {[c.tag for c in section]}")
        else:
            print("No Body tag found")
            
    except Exception as e:
        print(f"Debug Error: {e}")

def main():
    # Ensure data directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    xml_content = fetch_laws_xml()
    if xml_content:
        # debug_xml_structure(xml_content) # Uncomment if needed for main file
        
        laws = parse_laws_xml(xml_content)
        
        if not laws:
            print("No laws found in main Legis.xml. Attempting to fetch Immigration and Refugee Protection Act (I-2.5) directly...")
            irpa_url = "https://laws-lois.justice.gc.ca/eng/XML/I-2.5.xml"
            try:
                response = requests.get(irpa_url)
                response.raise_for_status()
                print("Debugging IRPA XML structure:")
                debug_xml_structure(response.content)
                laws = parse_laws_xml(response.content)
            except Exception as e:
                print(f"Failed to fetch IRPA directly: {e}")

        if laws:
            print(f"Extracted {len(laws)} sections.")
            with open(OUTPUT_FILE, "w") as f:
                json.dump(laws, f, indent=2)
            print(f"Saved to {OUTPUT_FILE}")
        else:
            print("No relevant laws found.")

if __name__ == "__main__":
    main()
