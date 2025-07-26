import requests
from bs4 import BeautifulSoup, NavigableString, Tag  # ← Added missing imports
from datetime import datetime, timezone, timedelta   # ← Added timedelta import
from fastapi import FastAPI
from urllib.parse import quote_plus
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

app = FastAPI()

SEARCH_QUERIES = [
    # Power/Electricity (BESCOM)
    "BESCOM power cut bangalore today",
    "BESCOM outage bangalore areas",
    "BESCOM maintenance work bangalore",
    "BESCOM power supply disruption",
    "bangalore electricity cut schedule",
    "BESCOM load shedding bangalore",
    
    # # Water Supply (BWSSB)
    # "BWSSB water cut bangalore today",
    # "BWSSB water supply disruption",
    # "BWSSB maintenance work bangalore",
    # "bangalore water shortage areas",
    # "BWSSB pipeline repair bangalore",
    # "BWSSB water tanker supply",
    
    # # Public Transport (BMTC/Metro)
    # "BMTC bus strike bangalore",
    # "BMTC route change bangalore",
    # "BMTC schedule change bangalore",
    # "namma metro service disruption",
    # "namma metro station closure",
    # "namma metro new route launch",
    # "bangalore metro maintenance work",
    # "BMTC holiday schedule bangalore",
    
    # # Traffic & Roads (BTP)
    # "BTP traffic alert bangalore",
    # "bangalore road closure today",
    # "traffic diversion bangalore",
    # "bangalore road construction",
    # "BTP traffic advisory",
    # "bangalore road blockade",
    
    # # Civic/Municipal (BBMP)
    # "BBMP garbage collection strike",
    # "BBMP road repair bangalore",
    # "BBMP property tax notice",
    # "BBMP health inspection",
    # "BBMP public meeting",
    # "BBMP festival arrangements",
    
    # # Emergency & Safety
    # "bangalore police advisory",
    # "bangalore emergency alert",
    # "bangalore protest today",
    # "bangalore bandh notice",
    # "bangalore curfew advisory",
    
    # # Government Events
    # "bangalore government meeting",
    # "karnataka government announcement",
    # "bangalore civic event today",
    # "bangalore public rally",
    # "bangalore inauguration ceremony",
    
    # # Weather & Seasonal
    # "bangalore rain alert",
    # "bangalore flood warning",
    # "bangalore monsoon advisory",
    # "bangalore weather emergency",
    
    # # Technology & Digital Services
    # "bangalore digital service downtime",
    # "BESCOM online payment issue",
    # "BWSSB app maintenance",
    # "BMTC app update",
    
    # # Special Events & Holidays
    # "bangalore festival traffic plan",
    # "bangalore holiday announcement",
    # "bangalore special event notice",
    # "bangalore cultural event alert"
]

UTILITY_KEYWORDS = [
    "alert", "notice", "diversion", "accident", "meeting", "event", "strike",
    "closure", "schedule change", "maintenance", "power cut", "water cut",
    "route change", "disruption", "holiday", "mela", "rally", "blockade",
    "advisory", "inauguration", "launch", "review", "inspection", "fare hike",
    "outage", "public meeting", "festival", "construction", "upgrade", "update",
    "bbmp", "bescom", "bwssb", "btp", "power cut", "water cut", "outage", "maintenance",
    "shutdown", "disruption", "traffic", "road", "alert", "notice", "advisory", "protest",
]

MAX_RESULTS_PER_QUERY = 2
SELENIUM_WAIT_SECS = 3

def contains_utility_keyword(text):
    return any(keyword in text.lower() for keyword in UTILITY_KEYWORDS)
###################################################################

def scrape_bbmp_tenders_selenium():
    """
    Uses Selenium to load the TenderDetail BBMP tenders page,
    extracts tender ID, title, description, and due date.
    """
    url = "https://www.tenderdetail.com/government-tenders/bruhat-bangalore-mahanagara-palike-tenders/1?agid=265"
    driver = setup_driver()
    driver.get(url)

    # Wait until at least one tender row appears
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".tenderbox"))
    )

    tenders = []
    now_iso = datetime.now(timezone.utc).isoformat()

    # Each tender is inside a div with class "tenderbox"
    for box in driver.find_elements(By.CSS_SELECTOR, ".tenderbox"):
        try:
            # ID is in the first <a> or <span> with class "btender"
            id_el = box.find_element(By.CSS_SELECTOR, ".btender")
            desc_el = box.find_element(By.CSS_SELECTOR, "a")
            # Due date often in a <span> or sibling with class "tdy"
            due_el = box.find_element(By.CSS_SELECTOR, ".tdy")

            tender_id = id_el.text.strip()
            full_desc = desc_el.text.strip()
            # Use the text of due_el; if format is dd-mm-yyyy, parse to ISO
            due_text = due_el.text.strip()
            try:
                due_dt = datetime.strptime(due_text, "%d-%m-%Y")\
                            .replace(tzinfo=timezone.utc)\
                            .isoformat()
            except:
                due_dt = now_iso

            # Title: first clause before comma or first 6 words
            title_part = full_desc.split(",", 1)[0]
            words = title_part.split()
            title = " ".join(words[:6]) + ("…" if len(words)>6 else "")

            tenders.append({
                "tenderId": tender_id,
                "title": title,
                "description": full_desc,
                "dueDate": due_dt,
                "url": url,
                "source": "BBMP Tenders"
            })
        except Exception:
            continue

    driver.quit()
    return tenders
################## Yahoo News: Requests+BS4 Only ##################

def scrape_yahoo_news(query, max_results=MAX_RESULTS_PER_QUERY):
    url = f"https://search.yahoo.com/search?p={quote_plus(query)}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        now = datetime.now(timezone.utc).isoformat()
        results = []
        count = 0
        for el in soup.select("h3.title a"):
            if count >= max_results:
                break
            title = el.get_text(strip=True)
            link = el.get("href")
            if title and link and contains_utility_keyword(title):
                results.append({
                    "title": title,
                    "url": link,
                    "published": now,
                    "source": f"Yahoo News ({query})",
                    "raw_text": title
                })
                count += 1
        return results
    except Exception as e:
        print(f"Error scraping Yahoo News for '{query}': {e}")
        return []

################## Selenium Setup ##################

def setup_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1200,800")
    options.add_argument("--log-level=3")  # Suppress Chrome logs
    return webdriver.Chrome(options=options)

def scrape_duckduckgo_news(query, max_results=7):
    url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        now = datetime.now(timezone.utc).isoformat()
        results = []
        count = 0
        for res in soup.select("a.result__a"):
            if count >= max_results:
                break
            title = res.get_text(strip=True)
            link = res.get("href", "")
            if title and link and contains_utility_keyword(title):
                results.append({
                    "title": title,
                    "url": link,
                    "published": now,
                    "source": f"DuckDuckGo ({query})",
                    "raw_text": title
                })
                count += 1
        return results
    except Exception as e:
        print(f"Error scraping DuckDuckGo for '{query}': {e}")
        return []

def scrape_bing_news_selenium(query, max_results=MAX_RESULTS_PER_QUERY):
    url = f"https://www.bing.com/news/search?q={quote_plus(query)}"
    driver = setup_driver()
    try:
        driver.get(url)
        time.sleep(SELENIUM_WAIT_SECS)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        now = datetime.now(timezone.utc).isoformat()
        headlines = []
        count = 0
        for card in soup.select("a.title"):
            if count >= max_results:
                break
            title = card.get_text(strip=True)
            link = card.get("href", "")
            if title and contains_utility_keyword(title):
                headlines.append({
                    "title": title,
                    "url": link,
                    "published": now,
                    "source": f"Bing News ({query})",
                    "raw_text": title,
                })
                count += 1
        return headlines
    except Exception as e:
        print(f"Error scraping Bing News for '{query}': {e}")
        return []
    finally:
        driver.quit()

def fetch_btp_alerts():
    """
    Scrape the live traffic/congestion alerts from the BTP modal on their homepage.
    """
    def get_text_preserving_a_content(block):
        texts = []
        for elem in block.descendants:
            if isinstance(elem, NavigableString):
                texts.append(str(elem))
            elif isinstance(elem, Tag) and elem.name == 'a':
                texts.append(elem.get_text())
        return ''.join(texts).strip()

    url = "https://btp.karnataka.gov.in/en"
    try:
        response = requests.get(url, timeout=12)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching BTP site: {e}")
        return []
    
    soup = BeautifulSoup(response.text, "html.parser")
    modal = soup.select_one(".modal-body.news-modal")
    if not modal:
        print("Element with class 'modal-body news-modal' not found.")
        return []

    blocks = []
    current_block = []
    for child in modal.children:
        if isinstance(child, Tag) and child.name == 'br':
            if current_block:
                blocks.append(current_block)
                current_block = []
        else:
            current_block.append(child)
    if current_block:
        blocks.append(current_block)

    alerts = []
    now = datetime.now(timezone.utc).isoformat()
    for block in blocks:
        temp_soup = BeautifulSoup("", "html.parser")
        container = temp_soup.new_tag("div")
        for node in block:
            container.append(node)
        temp_soup.append(container)
        text = get_text_preserving_a_content(container)
        if text and text.strip():
            alerts.append({
                "title": text.strip(),
                "url": "btp",
                "published": now,
                "source": "BTP",
                "raw_text": text.strip()
            })
    return alerts

def scrape_bic():
    url = "https://bangaloreinternationalcentre.org/"
    driver = setup_driver()
    try:
        driver.get(url)
        time.sleep(5)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        events = []
        for card in soup.select("div.card.event-card, .event-title, h3.event-title"):
            title = card.get_text(strip=True)
            if not title or "RSVP" in title or "closed" in title.lower(): 
                continue
            events.append({
                "title": title,
                "date": None,
                "location": "Bangalore International Centre (BIC)",
                "url": url,
                "source": "BIC"
            })
        return events
    except Exception as e:
        print(f"Error scraping BIC: {e}")
        return []
    finally:
        driver.quit()

################## Aggregator ##################

def fetch_all_slow_events():
    events = []
    events.extend(scrape_bic())
    
    # Deduplicate by (title, date, location)
    unique = {}
    for event in events:
        key = (event["title"].lower().strip(), str(event["date"]), event["location"].lower().strip())
        if key not in unique:
            unique[key] = event
    return list(unique.values())

def fetch_bangalore_utility_news_combo():
    all_results = []
    for query in SEARCH_QUERIES:
        all_results.extend(scrape_duckduckgo_news(query))
        all_results.extend(scrape_yahoo_news(query))
        all_results.extend(scrape_bing_news_selenium(query))
        time.sleep(1)
    
    # Add BTP alerts
    all_results.extend(fetch_btp_alerts())
    
    # Deduplicate by title (case-insensitive)
    unique = {}
    for item in all_results:
        key = item["title"][:60].lower().strip()
        if key not in unique:
            unique[key] = item
    return list(unique.values())

################## FastAPI Endpoints ##################

@app.get("/fast")
def get_bangalore_utilities_fast():
    """
    Returns recent Bangalore utility/civic news from Yahoo, DuckDuckGo, Bing News and BTP.
    """
    records = scrape_bbmp_tenders_selenium()
    return {"records": records, "scraped_at": datetime.now(timezone.utc).isoformat()}

@app.get("/slow")
def slow_events():
    """
    Scrape slow, non-critical events from BIC and other sources.
    """
    events = fetch_all_slow_events()
    return {
        "records": events,
        "scraped_at": datetime.now(timezone.utc).isoformat()
    }

# Add the endpoint you were trying to access
@app.get("/scrape")
def scrape_endpoint(type: str):
    """
    Unified scrape endpoint that routes to fast or slow scraping
    """
    if type == "fast":
        records = fetch_bangalore_utility_news_combo()
        return {"records": records, "scraped_at": datetime.now(timezone.utc).isoformat()}
    elif type == "slow":
        records = fetch_all_slow_events()
        return {"records": records, "scraped_at": datetime.now(timezone.utc).isoformat()}
    else:
        return {"error": "Invalid type. Use 'fast' or 'slow'"}

@app.get("/")
def root():
    """
    Root endpoint with available endpoints
    """
    return {
        "message": "Bangalore News & Events API",
        "endpoints": {
            "/fast": "Fast utility news scraping",
            "/slow": "Slow events scraping", 
            "/scrape?type=fast": "Unified fast scraping",
            "/scrape?type=slow": "Unified slow scraping",
            "/docs": "API documentation"
        }
    }
