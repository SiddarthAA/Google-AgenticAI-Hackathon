from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from datetime import datetime, timezone
import time
import re

def setup_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1200,800")
    options.add_argument("--log-level=3")
    return webdriver.Chrome(options=options)

def scrape_bbmp_tenders_selenium():
    """
    Scrape BBMP tenders based on actual page structure from debug output
    """
    url = "https://www.tenderdetail.com/government-tenders/bruhat-bangalore-mahanagara-palike-tenders/1?agid=265"
    driver = setup_driver()
    driver.get(url)
    time.sleep(5)
    
    # Get page text content
    soup = BeautifulSoup(driver.page_source, "html.parser")
    text_content = soup.get_text()
    lines = [line.strip() for line in text_content.split('\n') if line.strip()]
    
    driver.quit()
    
    tenders = []
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # Pattern: 8-digit tender ID followed by description
    tender_pattern = re.compile(r'^(\d{8})\s+(.+)$')
    
    i = 0
    while i < len(lines):
        line = lines[i]
        match = tender_pattern.match(line)
        
        if match:
            tender_id = match.group(1)
            description = match.group(2)
            
            # Look for due date in next few lines
            due_date = now_iso
            for j in range(i+1, min(i+4, len(lines))):
                if lines[j].startswith("Due Date :"):
                    date_text = lines[j].replace("Due Date :", "").strip()
                    try:
                        # Parse "Aug 4, 2025" format
                        due_dt = datetime.strptime(date_text, "%b %d, %Y")
                        due_date = due_dt.replace(tzinfo=timezone.utc).isoformat()
                    except:
                        # Fallback to current time
                        due_date = now_iso
                    break
            
            # Create title from first part of description
            title_words = description.split()[:8]  # First 8 words
            title = " ".join(title_words)
            if len(description.split()) > 8:
                title += "..."
            
            tenders.append({
                "tenderId": tender_id,
                "title": title,
                "description": description,
                "dueDate": due_date,
                "url": url,
                "source": "BBMP Tenders",
                "scraped_at": now_iso
            })
        
        i += 1
    
    print(f"Scraped {len(tenders)} BBMP tenders")
    return tenders

print(scrape_bbmp_tenders_selenium())