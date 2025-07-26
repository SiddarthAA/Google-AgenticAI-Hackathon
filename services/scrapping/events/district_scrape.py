from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from datetime import datetime, timezone
import time

def setup_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1200,800")
    options.add_argument("--log-level=3")
    return webdriver.Chrome(options=options)

def scrape_district_events():
    """
    Refined District.in scraper with better filtering
    """
    url = "https://www.district.in/"
    driver = setup_driver()
    driver.get(url)
    time.sleep(5)
    
    # Try to select Bangalore
    try:
        location_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label*='Select Location']"))
        )
        location_btn.click()
        time.sleep(2)
        
        bangalore_option = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//div[contains(text(), 'Bangalore')] | //li[contains(text(), 'Bangalore')]"))
        )
        bangalore_option.click()
        time.sleep(3)
        print("✅ Selected Bangalore successfully")
    except Exception as e:
        print(f"⚠️ Could not select Bangalore: {e}")
    
    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()
    
    events = []
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # Find all divs that contain both h5 and span elements
    all_divs = soup.select("div")
    
    for div in all_divs:
        try:
            h5_elements = div.select("h5")
            span_elements = div.select("span")
            
            if not h5_elements or not span_elements:
                continue
            
            # Extract title from h5
            title = None
            for h5 in h5_elements:
                h5_text = h5.get_text(strip=True)
                # Filter out UI elements
                ui_keywords = ['select location', 'use current', 'menu', 'search', 'filter', 'sort', 'login', 'signup']
                if (len(h5_text) > 5 and 
                    not any(keyword in h5_text.lower() for keyword in ui_keywords)):
                    title = h5_text
                    break
            
            if not title:
                continue
            
            # Extract meaningful span content
            details = []
            price_info = None
            date_info = None
            location_info = "Bangalore"
            
            for span in span_elements:
                span_text = span.get_text(strip=True)
                if (span_text and len(span_text) > 1 and 
                    not any(keyword in span_text.lower() for keyword in ['location', 'current', 'menu', 'search'])):
                    details.append(span_text)
                    
                    # Identify specific information
                    if "₹" in span_text or "onwards" in span_text.lower() or "free" in span_text.lower():
                        price_info = span_text
                    elif any(month in span_text for month in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']):
                        date_info = span_text
                    elif any(time_word in span_text.lower() for time_word in ['pm', 'am', ':', 'today', 'tomorrow']):
                        date_info = span_text
            
            # Look for buy links more broadly (not just in same div)
            event_url = url  # fallback
            
            # Method 1: Look for links in the same div
            div_links = div.select("a[href]")
            for link in div_links:
                href = link.get("href")
                if href and href not in ['#', 'javascript:void(0)']:
                    if href.startswith("/"):
                        event_url = f"https://www.district.in{href}"
                    elif href.startswith("http"):
                        event_url = href
                    break
            
            # Method 2: If no direct link, look for data attributes or parent containers
            if event_url == url:
                data_attrs = div.attrs
                for attr, value in data_attrs.items():
                    if 'href' in attr or 'url' in attr or 'link' in attr:
                        if isinstance(value, str) and ('http' in value or value.startswith('/')):
                            event_url = value if value.startswith('http') else f"https://www.district.in{value}"
                            break
            
            # Only add events with substantial content
            if (len(details) >= 2 and 
                len([d for d in details if len(d) > 3]) >= 2):  # At least 2 meaningful details
                
                events.append({
                    "title": title,
                    "description": " | ".join(details[:3]),
                    "price": price_info,
                    "date": date_info or now_iso,
                    "location": location_info,
                    "url": event_url,
                    "source": "District.in",
                    "scraped_at": now_iso,
                    "details_count": len(details)
                })
                
        except Exception as e:
            continue
    
    # Additional filtering: remove obvious non-events
    filtered_events = []
    for event in events:
        title_lower = event["title"].lower()
        # Skip if title suggests it's not an event
        skip_titles = ['location', 'menu', 'search', 'filter', 'login', 'signup', 'download', 'app']
        if not any(skip_word in title_lower for skip_word in skip_titles):
            filtered_events.append(event)
    
    # Deduplicate by title
    unique_events = {}
    for event in filtered_events:
        key = event["title"].lower().strip()
        if key not in unique_events:
            unique_events[key] = event
    
    final_events = list(unique_events.values())
    print(f"Found {len(final_events)} actual events from District.in (filtered from {len(events)} total)")
    return final_events

# Integration with your FastAPI

print(scrape_district_events())