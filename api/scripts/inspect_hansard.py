import requests
from bs4 import BeautifulSoup
import re

URL = "https://www.ourcommons.ca/documentviewer/en/35-2/house/hansard-index/page-ToC"

def inspect_page():
    print(f"Fetching {URL}...")
    try:
        response = requests.get(URL)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # The ToC usually lists sittings. Let's look for links with "sitting" in the text or href
        print("Searching for Sitting links...")
        sitting_links = []
        for a in soup.find_all('a', href=True):
            if "sitting" in a['href'].lower() or "sitting" in a.text.lower():
                sitting_links.append(a['href'])
        
        print(f"Found {len(sitting_links)} potential sitting links.")
        for link in sitting_links[:5]:
            print(f" - {link}")
            
        if sitting_links:
            # Pick the first one and inspect it
            first_sitting_url = "https://www.ourcommons.ca" + sitting_links[0]
            print(f"\nInspecting first sitting: {first_sitting_url}")
            
            resp_sitting = requests.get(first_sitting_url)
            resp_sitting.raise_for_status()
            soup_sitting = BeautifulSoup(resp_sitting.content, 'html.parser')
            
            # Check for XML button/link on this page
            print("Checking for XML download on sitting page...")
            xml_links = soup_sitting.find_all('a', href=re.compile(r'\.xml$', re.IGNORECASE))
            if xml_links:
                for x in xml_links:
                    print(f"FOUND XML: {x['href']}")
            else:
                print("No direct .xml links found on sitting page.")
                
            # Check for "XML" text in links (sometimes href is not .xml but endpoint)
            xml_text_links = soup_sitting.find_all('a', string=re.compile(r'XML', re.IGNORECASE))
            for x in xml_text_links:
                print(f"Found link with text 'XML': {x['href']}")

            # If no XML, let's look at HTML structure for content
            # Usually content is in div with class "content" or similar, or "hansard-content"
            print("\nInspecting HTML structure for content...")
            # Try to find a speech
            speeches = soup_sitting.find_all('div', class_='intervention')
            if speeches:
                print(f"Found {len(speeches)} interventions (speeches).")
                print("Sample first speech:")
                print(speeches[0].prettify()[:500])
            else:
                print("No 'intervention' divs found. Dumping first 1000 chars of body to guess structure:")
                print(soup_sitting.body.prettify()[:1000])

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_page()
