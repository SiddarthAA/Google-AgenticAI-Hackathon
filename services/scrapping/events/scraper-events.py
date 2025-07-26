import re
import json 
import time 
import requests
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

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
    url = "https://bhaagoindia.com/events/?city=bengaluru-4"
    driver = setup_driver()
    driver.get(url)
    time.sleep(7)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()
    events = []
    now_iso = datetime.now(timezone.utc).isoformat()
    articles = soup.select("article")
    for article in articles:
        try:
            if not article.find(string="Verified"):
                continue
            article_text = article.get_text()
            lines = [line.strip() for line in article_text.split('\n') if line.strip()]
            title = extract_event_title(article, lines)
            event_date = extract_event_date(article_text, now_iso)
            location = extract_event_location(article_text, title)
            event_url = extract_event_url(article, url)
            events.append({
                "title": title,
                "description": "",
                "date": event_date,
                "location": location,
                "url": event_url,
                "source": "BhaagoIndia",
                "scraped_at": now_iso
            })
        except Exception:
            continue
    return events

def extract_event_title(article, lines):
    title_element = article.select_one("h1, h2, h3, h4, h5, h6")
    if title_element:
        title = title_element.get_text(strip=True)
        if len(title) > 5:
            return title
    event_keywords = ['run', 'marathon', 'race', 'walk', 'cycling', 'triathlon', 'event']
    for line in lines:
        if (any(keyword.lower() in line.lower() for keyword in event_keywords)
            and 10 < len(line) < 100
            and not line.lower().startswith(('event date', 'location', 'verified'))):
            return line
    for line in lines:
        words = line.split()
        if (len(words) >= 2 and len(words) <= 8
            and sum(1 for word in words if word[0].isupper()) >= len(words) * 0.5):
            return line
    return "Running Event"

def extract_event_date(article_text, fallback_date):
    date_patterns = [
        r'(January|February|March|April|May|June|July|August|September|October|November|December|Jan\.|Feb\.|Mar\.|Apr\.|Aug\.|Sept\.|Oct\.|Nov\.|Dec\.)\s+(\d{1,2}),?\s+(\d{4})',
        r'(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})',
        r'(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})[/-](\d{1,2})[/-](\d{4})'
    ]
    for pattern in date_patterns:
        match = re.search(pattern, article_text, re.IGNORECASE)
        if match:
            try:
                groups = [g for g in match.groups() if g is not None]
                if len(groups) >= 3:
                    if groups[0].isdigit() and len(groups[0]) == 4:
                        year, month, day = groups[0], groups[1], groups[2]
                    elif groups[2].isdigit() and len(groups[2]) == 4:
                        if groups[0].isalpha():
                            month, day, year = groups[0], groups[1], groups[2]
                        else:
                            day, month, year = groups[0], groups[1], groups[2]
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
    location = "Bengaluru"
    area_patterns = [
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,?\s*Bengaluru\b',
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,?\s*Bangalore\b',
        r'(?:at|in|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
    ]
    combined_text = f"{title} {article_text}"
    for pattern in area_patterns:
        matches = re.findall(pattern, combined_text, re.IGNORECASE)
        for match in matches:
            false_positives = ['Event', 'Date', 'Time', 'Verified', 'Location', 'Registration']
            if match not in false_positives and len(match) > 2:
                return f"{match}, Bengaluru"
    location_indicators = re.findall(r'Location[:\s]+([^\n]+)', article_text, re.IGNORECASE)
    if location_indicators:
        loc = location_indicators[0].strip()
        if loc and len(loc) > 3:
            return loc if 'bengaluru' in loc.lower() or 'bangalore' in loc.lower() else f"{loc}, Bengaluru"
    return location

def extract_event_url(article, base_url):
    links = article.select("a[href]")
    for link in links:
        href = link.get("href")
        if href:
            skip_patterns = ['#', 'javascript:', 'mailto:', 'tel:', 'facebook.com', 'twitter.com', 'instagram.com']
            if any(pattern in href for pattern in skip_patterns):
                continue
            if href.startswith("/"):
                return f"https://bhaagoindia.com{href}"
            elif href.startswith("http"):
                return href
    return base_url

def scrape_district_events():
    url = "https://www.district.in/"
    driver = setup_driver()
    driver.get(url)
    time.sleep(5)
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
    except Exception:
        pass
    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()
    events = []
    now_iso = datetime.now(timezone.utc).isoformat()
    all_divs = soup.select("div")
    for div in all_divs:
        try:
            h5_elements = div.select("h5")
            span_elements = div.select("span")
            if not h5_elements or not span_elements:
                continue
            title = None
            ui_keywords = ['select location', 'use current', 'menu', 'search', 'filter', 'sort', 'login', 'signup']
            for h5 in h5_elements:
                h5_text = h5.get_text(strip=True)
                if (len(h5_text) > 5 and not any(keyword in h5_text.lower() for keyword in ui_keywords)):
                    title = h5_text
                    break
            if not title:
                continue
            details = []
            date_info = None
            location_info = "Bangalore"
            for span in span_elements:
                span_text = span.get_text(strip=True)
                if (span_text and len(span_text) > 1 and not any(keyword in span_text.lower() for keyword in ['location', 'current', 'menu', 'search'])):
                    details.append(span_text)
                    if any(month in span_text for month in ['Jul', 'Aug']):
                        date_info = span_text
                    elif any(time_word in span_text.lower() for time_word in ['pm', 'am', ':', 'today', 'tomorrow']):
                        date_info = span_text
            event_url = url
            div_links = div.select("a[href]")
            for link in div_links:
                href = link.get("href")
                if href and href not in ['#', 'javascript:void(0)']:
                    if href.startswith("/"):
                        event_url = f"https://www.district.in{href}"
                    elif href.startswith("http"):
                        event_url = href
                    break
            if event_url == url:
                data_attrs = div.attrs
                for attr, value in data_attrs.items():
                    if 'href' in attr or 'url' in attr or 'link' in attr:
                        if isinstance(value, str) and ('http' in value or value.startswith('/')):
                            event_url = value if value.startswith('http') else f"https://www.district.in{value}"
                            break
            if (len(details) >= 2 and len([d for d in details if len(d) > 3]) >= 2):
                events.append({
                    "title": title,
                    "description": " | ".join(details[:3]),
                    "date": date_info or now_iso,
                    "location": location_info,
                    "url": event_url,
                    "source": "District.in",
                    "scraped_at": now_iso
                })
        except Exception:
            continue
    filtered_events = []
    for event in events:
        title_lower = event["title"].lower()
        skip_titles = ['location', 'menu', 'search', 'filter', 'login', 'signup', 'download', 'app']
        if not any(skip_word in title_lower for skip_word in skip_titles):
            filtered_events.append(event)
    unique_events = {}
    for event in filtered_events:
        key = event["title"].lower().strip()
        if key not in unique_events:
            unique_events[key] = event
    final_events = list(unique_events.values())
    return final_events

def scrape_eventbrite_events():
    url = "https://www.eventbrite.com/d/india--bangalore/events/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    event_links = soup.find_all('a', class_='event-card-link')
    events = []
    now_iso = datetime.now(timezone.utc).isoformat()
    for link in event_links:
        event_url = link.get('href')
        h3_tag = link.find('h3', class_='Typography_root__487rx')
        time_tag = link.find_next('p', class_='Typography_root__487rx #3a3247 Typography_body-md-bold__487rx Typography_align-match-parent__487rx')
        location_tag = link.find_next('p', class_='Typography_root__487rx #585163 Typography_body-md__487rx event-card__clamp-line--one Typography_align-match-parent__487rx')
        event_time = time_tag.get_text(strip=True) if time_tag else ""
        event_location = location_tag.get_text(strip=True) if location_tag else ""
        if event_time:
            time_parts = event_time.split('•')
            date_part = time_parts[0].strip() if len(time_parts) > 0 else ""
            time_part = time_parts[1].strip() if len(time_parts) > 1 else ""
            formatted_time = time_part
            formatted_date = date_part
        else:
            formatted_time = ""
            formatted_date = ""
        if h3_tag:
            events.append({
                "title": h3_tag.get_text(strip=True),
                "description": "",
                "date": formatted_date + " " + formatted_time if formatted_date else "",
                "location": event_location,
                "url": event_url,
                "source": "Eventbrite",
                "scraped_at": now_iso
            })
    return events

def main():
    all_events = []
    all_events.extend(scrape_bhaago_india_events())
    all_events.extend(scrape_district_events())
    all_events.extend(scrape_eventbrite_events())
    print(json.dumps(all_events, indent=4))

if __name__ == "__main__":
    main()