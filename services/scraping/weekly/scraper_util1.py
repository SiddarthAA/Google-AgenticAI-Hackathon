import requests
from bs4 import BeautifulSoup, NavigableString, Tag
from datetime import datetime, timezone, timedelta
from urllib.parse import quote_plus
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import re

def extract_due_date_robust(box):
    """
    Robust due date extraction with multiple strategies
    """
    due_text = ""
    
    # Strategy 1: Look for common due date selectors
    due_selectors = ['.tdy', '.due-date', 'span[class*="date"]', '.date', '.tender-date']
    
    for sel in due_selectors:
        due_elem = box.select_one(sel)
        if due_elem:
            text = due_elem.get_text(strip=True)
            # Clean up the text - remove "Due Date:" prefix if present
            text = re.sub(r'^Due\s*Date\s*:?\s*', '', text, flags=re.IGNORECASE)
            if text and text.strip():
                due_text = text.strip()
                break
    
    # Strategy 2: Look for date patterns in the entire box text
    if not due_text:
        full_text = box.get_text()
        # Look for date patterns like DD-MM-YYYY, DD/MM/YYYY, etc.
        date_patterns = [
            r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b',  # DD-MM-YYYY or DD/MM/YYYY
            r'\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b',  # YYYY-MM-DD or YYYY/MM/DD
            r'\b(\d{1,2}\s+\w+\s+\d{4})\b'        # DD Month YYYY
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, full_text)
            if matches:
                due_text = matches[0]
                break
    
    # Strategy 3: Look for text after "Due Date" or similar labels
    if not due_text:
        full_text = box.get_text()
        # Look for patterns like "Due Date: 28-07-2025" or "Last Date: 28-07-2025"
        due_patterns = [
            r'Due\s*Date\s*:?\s*([^\n\r\|]+)',
            r'Last\s*Date\s*:?\s*([^\n\r\|]+)',
            r'Submission\s*Date\s*:?\s*([^\n\r\|]+)',
            r'Closing\s*Date\s*:?\s*([^\n\r\|]+)'
        ]
        
        for pattern in due_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                candidate = match.group(1).strip()
                # Validate that it looks like a date
                if re.search(r'\d', candidate) and len(candidate) > 5:
                    due_text = candidate
                    break
    
    # Strategy 4: Look in sibling elements or nearby spans
    if not due_text:
        # Find all spans and look for date-like content
        all_spans = box.find_all(['span', 'td', 'div'])
        for span in all_spans:
            text = span.get_text(strip=True)
            # Check if this looks like a date
            if re.match(r'\d{1,2}[-/]\d{1,2}[-/]\d{4}', text):
                due_text = text
                break
    
    return due_text

def scrape_bbmp_tenders_requests():
    """
    Improved requests-based scraping with better due date extraction
    """
    url = "https://www.tenderdetail.com/government-tenders/bruhat-bangalore-mahanagara-palike-tenders/1?agid=265"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Referer': 'https://www.tenderdetail.com/'
        }
        
        session = requests.Session()
        response = session.get(url, headers=headers, timeout=15, verify=False)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        tenders = []
        today_date = datetime.now().strftime("%Y-%m-%d")
        scraped_at = datetime.now(timezone.utc).isoformat()
        
        # Try multiple selectors for tender boxes
        tender_selectors = [
            '.tenderbox',
            '.tender-item',
            '.tender-row',
            'div[class*="tender"]',
            'tr'  # Sometimes tenders are in table rows
        ]
        
        tender_boxes = []
        for selector in tender_selectors:
            tender_boxes = soup.select(selector)
            if tender_boxes:
                print(f"Found {len(tender_boxes)} tenders using selector: {selector}")
                break
        
        if not tender_boxes:
            print("No tender boxes found with requests method")
            # Debug: print some of the page content
            print("Page content sample:", soup.get_text()[:500])
            return []
        
        for box in tender_boxes[:10]:  # Limit to first 10
            try:
                # Extract tender ID
                tender_id = ""
                id_selectors = ['.btender', '.tender-id', 'span[class*="id"]', 'strong', '.tender-no']
                for sel in id_selectors:
                    id_elem = box.select_one(sel)
                    if id_elem:
                        id_text = id_elem.get_text(strip=True)
                        # Look for tender number patterns
                        if re.search(r'tender|td|ref', id_text, re.IGNORECASE) or re.search(r'\d{4,}', id_text):
                            tender_id = id_text
                            break
                
                # Extract description
                full_desc = ""
                desc_selectors = ['a[href]', '.tender-title', '.title', 'h3', 'h4', '.tender-desc']
                for sel in desc_selectors:
                    desc_elem = box.select_one(sel)
                    if desc_elem:
                        desc_text = desc_elem.get_text(strip=True)
                        if len(desc_text) > 20:  # Ensure it's substantial
                            full_desc = desc_text
                            break
                
                # If no good description found, use the entire box text
                if not full_desc:
                    full_desc = box.get_text(strip=True)
                    # Clean up the description
                    full_desc = re.sub(r'\s+', ' ', full_desc)
                
                # Skip if we don't have essential information
                if not full_desc or len(full_desc) < 20:
                    continue
                
                # Extract due date using robust method
                due_text = extract_due_date_robust(box)
                
                # Parse and format the due date
                tender_date = today_date
                formatted_due_text = due_text
                
                if due_text:
                    try:
                        # Try different date formats
                        date_formats = [
                            '%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d', 
                            '%d.%m.%Y', '%d %m %Y',
                            '%d-%b-%Y', '%d %b %Y'
                        ]
                        
                        parsed_date = None
                        for fmt in date_formats:
                            try:
                                parsed_date = datetime.strptime(due_text.strip(), fmt)
                                tender_date = parsed_date.strftime("%Y-%m-%d")
                                formatted_due_text = parsed_date.strftime("%d-%m-%Y")
                                break
                            except ValueError:
                                continue
                        
                        # If no format worked, try extracting just the date part
                        if not parsed_date:
                            date_match = re.search(r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})', due_text)
                            if date_match:
                                try:
                                    parsed_date = datetime.strptime(date_match.group(1), '%d-%m-%Y')
                                    tender_date = parsed_date.strftime("%Y-%m-%d")
                                    formatted_due_text = parsed_date.strftime("%d-%m-%Y")
                                except:
                                    try:
                                        parsed_date = datetime.strptime(date_match.group(1), '%d/%m/%Y')
                                        tender_date = parsed_date.strftime("%Y-%m-%d")
                                        formatted_due_text = parsed_date.strftime("%d-%m-%Y")
                                    except:
                                        pass
                                        
                    except Exception as e:
                        print(f"Date parsing error: {e} for date: {due_text}")
                        formatted_due_text = due_text  # Keep original if parsing fails
                
                # Create title
                title_part = full_desc.split(",", 1)[0] if "," in full_desc else full_desc
                words = title_part.split()[:8]
                title_desc = " ".join(words) + ("..." if len(full_desc.split()) > 8 else "")
                
                if tender_id:
                    title = f"BBMP Tender {tender_id}: {title_desc}"
                else:
                    title = f"BBMP Tender: {title_desc}"
                
                # Create description - only add due date if we have a valid date
                description_parts = [full_desc]
                if formatted_due_text and formatted_due_text.strip():
                    description_parts.append(f"Due Date: {formatted_due_text}")
                if tender_id:
                    description_parts.append(f"Tender ID: {tender_id}")
                
                description = " | ".join(description_parts)
                
                tenders.append({
                    "title": title,
                    "description": description,
                    "date": tender_date,
                    "location": "Bangalore",
                    "url": url,
                    "source": "BBMP Tenders",
                    "scraped_at": scraped_at
                })
                
                print(f"Extracted tender: {title[:50]}... Due: {formatted_due_text}")
                
            except Exception as e:
                print(f"Error processing tender: {e}")
                continue
        
        return tenders
        
    except Exception as e:
        print(f"Error with requests method: {e}")
        return []

def scrape_bbmp_tenders():
    """
    Main function for scraping BBMP tenders
    """
    print("Attempting to scrape BBMP tenders...")
    
    tenders = scrape_bbmp_tenders_requests()
    
    if tenders:
        print(f"Successfully extracted {len(tenders)} tenders")
        return tenders
    else:
        print("No tenders found")
        return []

def main():
    """Test the function"""
    tenders = scrape_bbmp_tenders()
    
    if tenders:
        print(f"\nFound {len(tenders)} BBMP tenders:")
        print(json.dumps(tenders, indent=2, ensure_ascii=False))
    else:
        print("No tenders found or error occurred")

if __name__ == "__main__":
    main()
