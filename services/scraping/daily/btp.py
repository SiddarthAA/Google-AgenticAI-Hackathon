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

def fetch_btp_alerts():
    """
    Scrape the live traffic/congestion alerts from the BTP modal on their homepage.
    Returns data in the exact format matching the news scraper output.
    """
    
    def get_text_preserving_a_content(element):
        """Extract text while preserving link content"""
        if not element:
            return ""
        
        texts = []
        for elem in element.descendants:
            if isinstance(elem, NavigableString):
                text = str(elem).strip()
                if text:
                    texts.append(text)
            elif isinstance(elem, Tag) and elem.name == 'a':
                link_text = elem.get_text(strip=True)
                if link_text:
                    texts.append(link_text)
        
        return ' '.join(texts).strip()

    def try_requests_scraping():
        """First attempt: Use requests (faster)"""
        url = "https://btp.karnataka.gov.in/en"
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            }
            
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Try multiple selectors for the modal
            modal_selectors = [
                ".modal-body.news-modal",
                ".modal-body",
                ".news-modal",
                "#trafficModal .modal-body",
                "[data-target='#trafficModal']"
            ]
            
            modal = None
            for selector in modal_selectors:
                modal = soup.select_one(selector)
                if modal:
                    print(f"Found modal with selector: {selector}")
                    break
            
            if not modal:
                print("No modal found with requests method")
                return None
            
            return modal
            
        except Exception as e:
            print(f"Error with requests method: {e}")
            return None

    def try_selenium_scraping():
        """Fallback: Use Selenium for dynamic content"""
        url = "https://btp.karnataka.gov.in/en"
        
        try:
            # Setup Chrome options
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            driver = webdriver.Chrome(options=chrome_options)
            driver.get(url)
            
            # Wait for page to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Try to find and click any traffic/news modal trigger
            modal_triggers = [
                "a[data-target*='traffic']",
                "a[data-target*='modal']",
                ".traffic-alert",
                ".news-alert"
            ]
            
            for trigger_selector in modal_triggers:
                try:
                    trigger = driver.find_element(By.CSS_SELECTOR, trigger_selector)
                    driver.execute_script("arguments[0].click();", trigger)
                    time.sleep(2)
                    break
                except:
                    continue
            
            # Wait for modal to appear and find content
            modal_selectors = [
                ".modal-body.news-modal",
                ".modal-body",
                ".news-modal",
                "#trafficModal .modal-body"
            ]
            
            modal_element = None
            for selector in modal_selectors:
                try:
                    modal_element = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    print(f"Found modal with Selenium using selector: {selector}")
                    break
                except:
                    continue
            
            if modal_element:
                html_content = modal_element.get_attribute('innerHTML')
                modal = BeautifulSoup(html_content, "html.parser")
                driver.quit()
                return modal
            else:
                print("No modal found with Selenium method")
                driver.quit()
                return None
                
        except Exception as e:
            print(f"Error with Selenium method: {e}")
            try:
                driver.quit()
            except:
                pass
            return None

    def parse_modal_content(modal):
        """Parse modal content into structured alerts matching the exact format"""
        if not modal:
            return []
        
        alerts = []
        today_date = datetime.now().strftime("%Y-%m-%d")  # Format: 2025-07-26
        scraped_at = datetime.now(timezone.utc).isoformat()  # ISO format with timezone
        
        # Method 1: Try parsing by <br> tags
        try:
            # Get all content and split by <br> tags
            content_html = str(modal)
            
            # Split by <br> tags and clean up
            parts = content_html.split('<br')
            
            for part in parts:
                # Extract text from each part
                if '>' in part:
                    # Remove the remaining '>' and any attributes
                    text_part = part.split('>', 1)[-1]
                else:
                    text_part = part
                
                # Parse with BeautifulSoup to get clean text
                temp_soup = BeautifulSoup(text_part, "html.parser")
                text = temp_soup.get_text(strip=True)
                
                # Filter out empty or very short content
                if text and len(text) > 10:
                    # Split title and description for better formatting
                    title = text[:100] + "..." if len(text) > 100 else text
                    description = text
                    
                    alerts.append({
                        "title": title,
                        "description": description,
                        "date": today_date,
                        "location": "Bangalore",
                        "url": "https://btp.karnataka.gov.in/en",
                        "source": "BTP Traffic Alert",
                        "scraped_at": scraped_at
                    })
        
        except Exception as e:
            print(f"Error parsing by <br> tags: {e}")
        
        # Method 2: Try parsing by paragraphs if Method 1 failed
        if not alerts:
            try:
                paragraphs = modal.find_all(['p', 'div', 'span'])
                for p in paragraphs:
                    text = p.get_text(strip=True)
                    if text and len(text) > 10:
                        # Split title and description for better formatting
                        title = text[:100] + "..." if len(text) > 100 else text
                        description = text
                        
                        alerts.append({
                            "title": title,
                            "description": description,  
                            "date": today_date,
                            "location": "Bangalore",
                            "url": "https://btp.karnataka.gov.in/en",
                            "source": "BTP Traffic Alert",
                            "scraped_at": scraped_at
                        })
            except Exception as e:
                print(f"Error parsing by paragraphs: {e}")
        
        # Method 3: Get all text as fallback
        if not alerts:
            try:
                all_text = modal.get_text(strip=True)
                if all_text and len(all_text) > 20:
                    # Split by common delimiters
                    sentences = all_text.replace('\n\n', '|').replace('\n', ' ').split('|')
                    for sentence in sentences:
                        sentence = sentence.strip()
                        if sentence and len(sentence) > 10:
                            # Split title and description for better formatting
                            title = sentence[:100] + "..." if len(sentence) > 100 else sentence
                            description = sentence
                            
                            alerts.append({
                                "title": title,
                                "description": description,
                                "date": today_date,
                                "location": "Bangalore", 
                                "url": "https://btp.karnataka.gov.in/en",
                                "source": "BTP Traffic Alert",
                                "scraped_at": scraped_at
                            })
            except Exception as e:
                print(f"Error with fallback parsing: {e}")
        
        return alerts

    # Main execution flow
    print("Attempting to fetch BTP alerts...")
    
    # Try requests first (faster)
    modal = try_requests_scraping()
    
    # If requests failed, try Selenium
    if not modal:
        print("Requests method failed, trying Selenium...")
        modal = try_selenium_scraping()
    
    # Parse the modal content
    if modal:
        alerts = parse_modal_content(modal)
        print(f"Successfully extracted {len(alerts)} alerts")
        return alerts
    else:
        print("Failed to find modal content with both methods")
        return []

def main():
    """Test the function"""
    alerts = fetch_btp_alerts()
    
    if alerts:
        print(f"\nFound {len(alerts)} BTP alerts:")
        print(json.dumps(alerts, indent=2, ensure_ascii=False))
    else:
        print("No alerts found or error occurred")

# Only run if script is executed directly
if __name__ == "__main__":
    main()

