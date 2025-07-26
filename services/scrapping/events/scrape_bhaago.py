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

def scrape_bhaago_india_events():
    """
    General scraper for BhaagoIndia events - adapts to any event format
    """
    url = "https://bhaagoindia.com/events/?city=bengaluru-4"
    driver = setup_driver()
    driver.get(url)
    time.sleep(7)
    
    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()
    
    events = []
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # Find all article elements
    articles = soup.select("article")
    
    for article in articles:
        try:
            # Only process verified events
            if not article.find(text="Verified"):
                continue
            
            article_text = article.get_text()
            lines = [line.strip() for line in article_text.split('\n') if line.strip()]
            
            # Extract title - look for the main event name
            title = extract_event_title(article, lines)
            
            # Extract date using flexible patterns
            event_date = extract_event_date(article_text, now_iso)
            
            # Extract location generically
            location = extract_event_location(article_text, title)
            
            # Get event URL
            event_url = extract_event_url(article, url)
            
            # Determine event category
            category = determine_event_category(title, article_text)
            
            events.append({
                "title": title,
                "date": event_date,
                "location": location,
                "url": event_url,
                "source": "BhaagoIndia",
                "category": category,
                "scraped_at": now_iso
            })
            
        except Exception as e:
            print(f"Error processing BhaagoIndia event: {e}")
            continue
    
    print(f"Found {len(events)} verified events from BhaagoIndia")
    return events

def extract_event_title(article, lines):
    """Extract event title using multiple strategies"""
    # Strategy 1: Look for h1-h6 tags
    title_element = article.select_one("h1, h2, h3, h4, h5, h6")
    if title_element:
        title = title_element.get_text(strip=True)
        if len(title) > 5:  # Valid title
            return title
    
    # Strategy 2: Look for lines with event keywords and reasonable length
    event_keywords = ['run', 'marathon', 'race', 'walk', 'cycling', 'triathlon', 'event']
    for line in lines:
        if (any(keyword.lower() in line.lower() for keyword in event_keywords) 
            and 10 < len(line) < 100  # Reasonable title length
            and not line.lower().startswith(('event date', 'location', 'verified'))):
            return line
    
    # Strategy 3: Look for title-like formatting (capitalized words)
    for line in lines:
        words = line.split()
        if (len(words) >= 2 and len(words) <= 8 
            and sum(1 for word in words if word[0].isupper()) >= len(words) * 0.5):
            return line
    
    return "Running Event"  # Fallback

def extract_event_date(article_text, fallback_date):
    """Extract date using flexible regex patterns"""
    # Common date patterns
    date_patterns = [
        # July 27, 2025 | Aug. 31, 2025 | Sept. 28, 2025
        r'(January|February|March|April|May|June|July|August|September|October|November|December|Jan\.|Feb\.|Mar\.|Apr\.|Aug\.|Sept\.|Oct\.|Nov\.|Dec\.)\s+(\d{1,2}),?\s+(\d{4})',
        # 27 July 2025 | 31 Aug 2025
        r'(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})',
        # 2025-07-27 | 27-07-2025 | 27/07/2025
        r'(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})[/-](\d{1,2})[/-](\d{4})'
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, article_text, re.IGNORECASE)
        if match:
            try:
                groups = [g for g in match.groups() if g is not None]
                
                if len(groups) >= 3:
                    # Handle different date formats
                    if groups[0].isdigit() and len(groups[0]) == 4:  # Year first
                        year, month, day = groups[0], groups[1], groups[2]
                    elif groups[2].isdigit() and len(groups[2]) == 4:  # Year last
                        if groups[0].isalpha():  # Month name first
                            month, day, year = groups[0], groups[1], groups[2]
                        else:  # Day first
                            day, month, year = groups[0], groups[1], groups[2]
                    
                    # Convert month names/abbreviations to numbers
                    month_map = {
                        'january': 1, 'jan.': 1, 'jan': 1,
                        'february': 2, 'feb.': 2, 'feb': 2,
                        'march': 3, 'mar.': 3, 'mar': 3,
                        'april': 4, 'apr.': 4, 'apr': 4,
                        'may': 5,
                        'june': 6, 'jun': 6,
                        'july': 7, 'jul': 7,
                        'august': 8, 'aug.': 8, 'aug': 8,
                        'september': 9, 'sept.': 9, 'sep': 9,
                        'october': 10, 'oct.': 10, 'oct': 10,
                        'november': 11, 'nov.': 11, 'nov': 11,
                        'december': 12, 'dec.': 12, 'dec': 12
                    }
                    
                    if isinstance(month, str) and month.lower() in month_map:
                        month = month_map[month.lower()]
                    
                    event_date = datetime(int(year), int(month), int(day))
                    return event_date.replace(tzinfo=timezone.utc).isoformat()
                    
            except (ValueError, IndexError):
                continue
    
    return fallback_date

def extract_event_location(article_text, title):
    """Extract location information generically"""
    # Start with base location
    location = "Bengaluru"
    
    # Common Bangalore area patterns
    area_patterns = [
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,?\s*Bengaluru\b',  # "Area Name, Bengaluru"
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,?\s*Bangalore\b',  # "Area Name, Bangalore"  
        r'(?:at|in|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',      # "at Area Name"
    ]
    
    combined_text = f"{title} {article_text}"
    
    for pattern in area_patterns:
        matches = re.findall(pattern, combined_text, re.IGNORECASE)
        for match in matches:
            # Filter out common false positives
            false_positives = ['Event', 'Date', 'Time', 'Verified', 'Location', 'Registration']
            if match not in false_positives and len(match) > 2:
                return f"{match}, Bengaluru"
    
    # Look for specific location indicators in text
    location_indicators = re.findall(r'Location[:\s]+([^\n]+)', article_text, re.IGNORECASE)
    if location_indicators:
        loc = location_indicators[0].strip()
        if loc and len(loc) > 3:
            return loc if 'bengaluru' in loc.lower() or 'bangalore' in loc.lower() else f"{loc}, Bengaluru"
    
    return location

def extract_event_url(article, base_url):
    """Extract event-specific URL"""
    # Look for links within the article
    links = article.select("a[href]")
    
    for link in links:
        href = link.get("href")
        if href:
            # Skip navigation/external links
            skip_patterns = ['#', 'javascript:', 'mailto:', 'tel:', 'facebook.com', 'twitter.com', 'instagram.com']
            if any(pattern in href for pattern in skip_patterns):
                continue
                
            # Make absolute URL
            if href.startswith("/"):
                return f"https://bhaagoindia.com{href}"
            elif href.startswith("http"):
                return href
    
    return base_url

def determine_event_category(title, article_text):
    """Determine event category based on content"""
    combined_text = f"{title} {article_text}".lower()
    
    category_keywords = {
        'Marathon': ['marathon', 'full marathon', '42k', '42.2k'],
        'Half Marathon': ['half marathon', '21k', '21.1k'],
        'Running': ['run', '5k', '10k', 'running', 'habit run'],
        'Cycling': ['cycling', 'cycle', 'bike', 'bicycle'],
        'Triathlon': ['triathlon', 'tri', 'swim bike run'],
        'Walking': ['walk', 'walking', 'walkathon'],
        'Trail': ['trail', 'trail run', 'mountain'],
        'Fitness': ['fitness', 'workout', 'training']
    }
    
    for category, keywords in category_keywords.items():
        if any(keyword in combined_text for keyword in keywords):
            return category
    
    return "Sports Event"

print(scrape_bhaago_india_events())