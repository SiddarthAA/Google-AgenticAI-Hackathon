import re 
import json
import asyncio
import aiohttp
from bs4 import BeautifulSoup

class Scraper:
    def __init__(self, base_url, category_url):
        self.base_url = base_url
        self.category_url = category_url
        self.data_list = []
        self.headers = {"User-Agent": "Mozilla/5.0"}

    async def fetch(self, session, url):
        try:
            async with session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    print(f'Error fetching {url}: {response.status}')
                    return None
        except Exception as e:
            print(f'Exception while fetching {url}: {e}')
            return None

    async def article_scraper(self, session, article_url):
        html = await self.fetch(session, article_url)
        if not html:
            return
        soup = BeautifulSoup(html, 'html.parser')
        data = {}
        title_element = soup.find('h1')
        data['title'] = title_element.get_text(strip=True) if title_element else ''
        byline_div = soup.find('div', class_=re.compile('byline|Updated'))  
        if byline_div:
            match = re.search(r'\w{3,9}\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}\s+\w{2,3}', byline_div.text)
            data['published_date'] = match.group(0) if match else ''
        else:
            data['published_date'] = ''
        author_meta = soup.find('meta', {'name': 'author'})
        data['author'] = author_meta['content'] if author_meta else ''

        paragraphs = soup.find_all('p')
        content = '\n'.join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
        data['content'] = content
        self.data_list.append(data)

    async def scrape(self):
        tasks = []
        async with aiohttp.ClientSession() as session:
            html = await self.fetch(session, self.category_url)
            if not html:
                return
            soup = BeautifulSoup(html, 'html.parser')
            # Collect all <a href=...> elements
            article_links = soup.find_all('a', href=True)
            seen = set()
            for link in article_links:
                href = link['href']
                if '/articleshow/' in href and href not in seen:
                    seen.add(href)
                    full_url = href if href.startswith('http') else self.base_url + href
                    tasks.append(self.article_scraper(session, full_url))
            await asyncio.gather(*tasks)

    def get_json(self):
        return json.dumps(self.data_list, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    import sys
    default_base_url = 'https://timesofindia.indiatimes.com'
    if len(sys.argv) > 1:
        base_URL = sys.argv[1]
    else:
        base_URL = default_base_url
    category_URL = f'{base_URL}/city/bangalore'
    scraper = Scraper(base_URL, category_URL)
    asyncio.run(scraper.scrape())
    print(scraper.get_json())
