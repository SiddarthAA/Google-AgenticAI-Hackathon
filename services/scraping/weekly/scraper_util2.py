import requests
from bs4 import BeautifulSoup
import time
import json
from datetime import datetime, timezone, timedelta
from urllib.parse import quote_plus, urljoin
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed
import re

# Search queries with date-specific terms
def get_dated_queries(date_str):
    """Generate date-specific search queries"""
    base_queries = [
        "BESCOM power cut bangalore",
        "BWSSB water cut bangalore", 
        "BMTC bus strike bangalore",
        "namma metro service disruption",
        "bangalore traffic jam",
        "bangalore emergency alert",
        "bangalore protest",
        "bangalore bandh",
        "bangalore police advisory",
        "bangalore rain alert",
        "bangalore flood warning",
        "bangalore airport disruption",
        "bangalore bank strike",
        "bangalore hospital emergency",
        "BESCOM online payment down"
    ]
    
    # Add date variations to queries
    dated_queries = []
    for query in base_queries:
        dated_queries.extend([
            f"{query} {date_str}",
            f"{query} today",
            f"{query} latest"
        ])
    
    return dated_queries

UTILITY_KEYWORDS = [
    "alert", "notice", "diversion", "accident", "meeting", "event", "strike",
    "closure", "schedule change", "maintenance", "power cut", "water cut",
    "route change", "disruption", "holiday", "mela", "rally", "blockade",
    "advisory", "inauguration", "launch", "review", "inspection", "fare hike",
    "outage", "public meeting", "festival", "construction", "upgrade", "update",
    "bbmp", "bescom", "bwssb", "btp", "shutdown", "traffic", "road", "protest",
    "emergency", "bandh", "jam"
]

class ImprovedNewsScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        })
        self.today = datetime.now().strftime("%Y-%m-%d")
    
    def is_recent_news(self, text: str, url: str) -> bool:
        """Check if news is from today or very recent"""
        if not text:
            return False
            
        text_lower = text.lower()
        today_patterns = [
            "today", "this morning", "this afternoon", "this evening",
            self.today, "26 july 2025", "july 26", "26/07/2025",
            "breaking", "latest", "just now", "minutes ago", "hours ago"
        ]
        
        # Check for recent time indicators
        for pattern in today_patterns:
            if pattern in text_lower:
                return True
        
        # Check URL for date indicators
        if any(date_part in url for date_part in [self.today.replace("-", ""), "2025"]):
            return True
            
        return False
    
    def contains_utility_keyword(self, title: str) -> bool:
        """Check if title contains utility-related keywords"""
        if not title:
            return False
        title_lower = title.lower()
        return any(keyword.lower() in title_lower for keyword in UTILITY_KEYWORDS)
    
    def get_clean_url(self, raw_url: str) -> str:
        """Extract clean URL from Yahoo redirect URLs"""
        if not raw_url:
            return ""
            
        # Handle Yahoo redirect URLs
        if "r.search.yahoo.com" in raw_url:
            try:
                # Extract the actual URL from Yahoo redirect
                if "RU=" in raw_url:
                    actual_url = raw_url.split("RU=")[1].split("/RK=")[0]
                    return requests.utils.unquote(actual_url)
            except:
                pass
        
        # Handle relative URLs
        if raw_url.startswith("/"):
            return f"https://search.yahoo.com{raw_url}"
            
        return raw_url
    
    def scrape_with_fallback(self, url: str) -> str:
        """Scrape content with multiple fallback strategies"""
        try:
            # First attempt with current session
            response = self.session.get(url, timeout=8, allow_redirects=True)
            if response.status_code == 200:
                return self.extract_content(response.text)
        except:
            pass
        
        try:
            # Second attempt with fresh headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://www.google.com/',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            response = requests.get(url, headers=headers, timeout=8, allow_redirects=True)
            if response.status_code == 200:
                return self.extract_content(response.text)
        except:
            pass
            
        return ""
    
    def extract_content(self, html: str) -> str:
        """Extract meaningful content from HTML"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'ads']):
                element.decompose()
            
            # Try multiple content selectors
            content_selectors = [
                'article', '.article-content', '.story-content', 
                '.post-content', '.content', '.entry-content',
                '[data-module="ArticleBody"]', '.article-body'
            ]
            
            content = ""
            for selector in content_selectors:
                element = soup.select_one(selector)
                if element:
                    paragraphs = element.find_all('p')[:4]  # First 4 paragraphs
                    content = ' '.join([p.get_text(strip=True) for p in paragraphs])
                    break
            
            # Fallback to all paragraphs
            if not content:
                paragraphs = soup.find_all('p')[:4]
                content = ' '.join([p.get_text(strip=True) for p in paragraphs])
            
            # Clean and limit content
            if content:
                content = re.sub(r'\s+', ' ', content)  # Normalize whitespace
                content = content[:500] + "..." if len(content) > 500 else content
            
            return content
        except:
            return ""
    
    def search_news_sources(self, query: str) -> List[Dict]:
        """Search multiple news sources for better results"""
        results = []
        scraped_at = datetime.now(timezone.utc).isoformat()
        
        # Try DuckDuckGo (more reliable than Yahoo)
        try:
            search_url = f"https://duckduckgo.com/html/?q={quote_plus(query + ' site:timesofindia.indiatimes.com OR site:indianexpress.com OR site:thehindu.com OR site:deccanherald.com OR site:oneindia.com')}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(search_url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract search results
            for result in soup.select('.result')[:3]:  # Top 3 results
                try:
                    title_elem = result.select_one('.result__title a')
                    snippet_elem = result.select_one('.result__snippet')
                    
                    if title_elem and snippet_elem:
                        title = title_elem.get_text(strip=True)
                        url = title_elem.get('href', '')
                        snippet = snippet_elem.get_text(strip=True)
                        
                        # Filter for utility keywords and recent news
                        if (self.contains_utility_keyword(title) and 
                            self.is_recent_news(title + " " + snippet, url)):
                            
                            # Try to get full content
                            full_content = self.scrape_with_fallback(url)
                            description = full_content if full_content else snippet
                            
                            results.append({
                                "title": title,
                                "description": description,
                                "date": self.today,
                                "location": "Bangalore",
                                "url": url,
                                "source": "DuckDuckGo Search",
                                "scraped_at": scraped_at,
                                "relevance_score": self.calculate_relevance(title, description)
                            })
                except:
                    continue
                    
        except Exception as e:
            print(f"Search error for '{query}': {e}")
        
        return results
    
    def calculate_relevance(self, title: str, description: str) -> float:
        """Calculate relevance score based on keywords and recency"""
        score = 0.0
        text = (title + " " + description).lower()
        
        # Keyword scoring
        high_priority_keywords = ["power cut", "water cut", "strike", "bandh", "emergency", "alert"]
        medium_priority_keywords = ["traffic", "jam", "disruption", "maintenance", "protest"]
        recent_keywords = ["today", "breaking", "latest", "now", self.today]
        
        for keyword in high_priority_keywords:
            if keyword in text:
                score += 3.0
                
        for keyword in medium_priority_keywords:
            if keyword in text:
                score += 2.0
                
        for keyword in recent_keywords:
            if keyword in text:
                score += 1.5
        
        return score
    
    def scrape_all_queries(self, queries: List[str]) -> List[Dict]:
        """Scrape all queries with improved error handling"""
        all_results = []
        
        with ThreadPoolExecutor(max_workers=2) as executor:  # Reduced for stability
            future_to_query = {
                executor.submit(self.search_news_sources, query): query 
                for query in queries[:10]  # Limit to top 10 queries
            }
            
            for future in as_completed(future_to_query):
                try:
                    results = future.result()
                    all_results.extend(results)
                    time.sleep(1)  # Rate limiting
                except Exception as e:
                    print(f"Query failed: {e}")
        
        return all_results
    
    def close(self):
        """Clean up session"""
        self.session.close()

def fetch_bangalore_utility_news():
    """Main function to fetch recent utility news"""
    scraper = ImprovedNewsScraper()
    today_str = datetime.now().strftime("%B %d, %Y")
    
    try:
        # Generate date-specific queries
        queries = get_dated_queries(today_str)
        
        # Scrape all queries
        all_results = scraper.scrape_all_queries(queries)
        
        # Deduplicate and sort by relevance
        unique = {}
        for item in all_results:
            url_key = item['url']
            if url_key not in unique or unique[url_key]['relevance_score'] < item['relevance_score']:
                unique[url_key] = item
        
        # Sort by relevance score
        sorted_results = sorted(unique.values(), key=lambda x: x['relevance_score'], reverse=True)
        
        # Filter for today's date only
        today_results = [
            item for item in sorted_results 
            if item['date'] == scraper.today or 
            scraper.is_recent_news(item['title'] + " " + item['description'], item['url'])
        ]
        
        return today_results[:15]  # Return top 15 most relevant results
    
    finally:
        scraper.close()

def main():
    """Main execution function"""
    start_time = time.time()
    results = fetch_bangalore_utility_news()
    end_time = time.time()
    
    print(f"Scraping completed in {end_time - start_time:.2f} seconds")
    print(f"Found {len(results)} recent utility news items for {datetime.now().strftime('%Y-%m-%d')}")
    
    if results:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        print("No recent utility news found for today. This might indicate:")
        print("1. No major utility disruptions today")
        print("2. News sources haven't updated yet")
        print("3. Search filters are too restrictive")

if __name__ == "__main__":
    main()
