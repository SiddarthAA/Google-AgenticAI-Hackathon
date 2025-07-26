import requests
from bs4 import BeautifulSoup, NavigableString, Tag
from datetime import datetime, timezone
from urllib.parse import quote_plus
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BangaloreScraper:
    """
    A class to scrape Bangalore-related utility news and tenders.
    """
    SEARCH_QUERIES = [
        # Power/Electricity (BESCOM)
        "BESCOM power cut bangalore today", "BESCOM outage bangalore areas",
        "BESCOM maintenance work bangalore", "BESCOM power supply disruption",
        "bangalore electricity cut schedule", "BESCOM load shedding bangalore",
        # Water Supply (BWSSB)
        "BWSSB water cut bangalore today", "BWSSB water supply disruption",
        "BWSSB maintenance work bangalore", "bangalore water shortage areas",
        "BWSSB pipeline repair bangalore", "BWSSB water tanker supply",
        # Traffic & Roads (BTP)
        "BTP traffic alert bangalore", "bangalore road closure today",
        "traffic diversion bangalore", "bangalore road construction",
        "BTP traffic advisory", "bangalore road blockade",
        # Civic/Municipal (BBMP)
        "BBMP garbage collection strike", "BBMP road repair bangalore",
        "BBMP property tax notice", "BBMP public meeting",
    ]

    UTILITY_KEYWORDS = [
        "alert", "notice", "diversion", "accident", "meeting", "strike",
        "closure", "schedule change", "maintenance", "power cut", "water cut",
        "route change", "disruption", "blockade", "advisory", "construction",
        "outage", "public meeting", "protest", "bbmp", "bescom", "bwssb", "btp",
        "traffic", "road", "shutdown"
    ]

    MAX_RESULTS_PER_QUERY = 3
    SELENIUM_WAIT_SECS = 3

    def __init__(self):
        """Initializes the scraper."""
        pass

    def _setup_driver(self):
        """Configures and returns a headless Selenium Chrome driver."""
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1200,800")
        options.add_argument("--log-level=3")
        return webdriver.Chrome(options=options)

    def _contains_utility_keyword(self, text):
        """Checks if a text string contains any of the utility keywords."""
        return any(keyword in text.lower() for keyword in self.UTILITY_KEYWORDS)

    def _scrape_bbmp_tenders_selenium(self):
        """
        Scrapes the TenderDetail BBMP tenders page using Selenium.
        """
        url = "https://www.tenderdetail.com/government-tenders/bruhat-bangalore-mahanagara-palike-tenders/1?agid=265"
        driver = self._setup_driver()
        tenders = []
        try:
            driver.get(url)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".tenderbox"))
            )
            now_iso = datetime.now(timezone.utc).isoformat()

            for box in driver.find_elements(By.CSS_SELECTOR, ".tenderbox"):
                try:
                    id_el = box.find_element(By.CSS_SELECTOR, ".btender")
                    desc_el = box.find_element(By.CSS_SELECTOR, "a")
                    due_el = box.find_element(By.CSS_SELECTOR, ".tdy")
                    
                    tender_id = id_el.text.strip()
                    full_desc = desc_el.text.strip()
                    due_text = due_el.text.strip()
                    
                    try:
                        due_dt = datetime.strptime(due_text, "%d-%m-%Y").replace(tzinfo=timezone.utc).isoformat()
                    except ValueError:
                        due_dt = now_iso

                    title = " ".join(full_desc.split(None, 6)[:6]) + ("..." if len(full_desc.split()) > 6 else "")

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
        finally:
            driver.quit()
        return tenders

    def get_bbmp_tenders(self):
        """
        Public method to fetch BBMP tenders.
        Returns a list of tender dictionaries.
        """
        print("Scraping BBMP tenders...")
        return self._scrape_bbmp_tenders_selenium()

    def _scrape_duckduckgo_news(self, query):
        """Scrapes DuckDuckGo News for a given query."""
        url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
        results = []
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            now = datetime.now(timezone.utc).isoformat()
            for res in soup.select("a.result__a")[:self.MAX_RESULTS_PER_QUERY]:
                title = res.get_text(strip=True)
                link = res.get("href", "")
                if title and link and self._contains_utility_keyword(title):
                    results.append({"title": title, "url": link, "published": now, "source": f"DuckDuckGo ({query})", "raw_text": title})
        except Exception as e:
            print(f"Error scraping DuckDuckGo for '{query}': {e}")
        return results

    def _fetch_btp_alerts(self):
        """Scrapes live traffic alerts from the BTP homepage."""
        url = "https://btp.karnataka.gov.in/en"
        alerts = []
        try:
            response = requests.get(url, timeout=12)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            modal = soup.select_one(".modal-body.news-modal")
            if not modal:
                return []
            
            # Extract text while preserving line breaks logic
            text_content = modal.decode_contents().replace('<br/>', '\n').replace('<br>', '\n')
            soup = BeautifulSoup(text_content, "html.parser")
            raw_text = soup.get_text(separator='\n').strip()
            
            now = datetime.now(timezone.utc).isoformat()
            for line in raw_text.split('\n'):
                cleaned_line = line.strip()
                if cleaned_line:
                    alerts.append({
                        "title": cleaned_line,
                        "url": "btp",
                        "published": now,
                        "source": "BTP",
                        "raw_text": cleaned_line
                    })
        except Exception as e:
            print(f"Error fetching BTP site: {e}")
        return alerts

    def scrape_and_save_utility_news(self, output_filename="utility_news.json"):
        """
        Batches search queries, scrapes news from all sources,
        and saves the aggregated results to a JSON file.
        """
        print("Starting utility news scraping...")
        all_results = []
        
        # Scrape from search engines
        for i, query in enumerate(self.SEARCH_QUERIES):
            print(f"Scraping query {i+1}/{len(self.SEARCH_QUERIES)}: '{query}'")
            all_results.extend(self._scrape_duckduckgo_news(query))
            # NOTE: Other scrapers (Yahoo, Bing) were removed for brevity
            # but can be added back here following the same pattern.
            time.sleep(1)
        
        # Add BTP alerts
        print("Fetching BTP alerts...")
        all_results.extend(self._fetch_btp_alerts())
        
        # Deduplicate by title (case-insensitive)
        unique = {}
        for item in all_results:
            key = item["title"][:80].lower().strip()
            if key not in unique:
                unique[key] = item
        
        final_results = list(unique.values())
        
        # Save to file
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(final_results, f, indent=4, ensure_ascii=False)
            
        print(f"\nScraping complete. Found {len(final_results)} unique items.")
        print(f"Results saved to '{output_filename}'")
        return final_results

if __name__ == '__main__':
    # This block demonstrates how to use the class
    scraper = BangaloreScraper()

    # 1. Get BBMP Tenders and print them in a JSON-like format
    print("--- Fetching BBMP Tenders ---")
    bbmp_tenders = scraper.get_bbmp_tenders()
    print(json.dumps(bbmp_tenders, indent=2))
    print("\n" + "="*40 + "\n")

    # 2. Scrape all utility news and save it to a file
    print("--- Fetching Utility News ---")
    scraper.scrape_and_save_utility_news()