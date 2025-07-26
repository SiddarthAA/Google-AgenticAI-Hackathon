from fastapi import FastAPI, BackgroundTasks, HTTPException
import os
from daily import btp, scraper_instagram
from weekly import scraper_events, scraper_util1, scraper_util2
import json

app = FastAPI()

def scrape_hourly_services():

    btp_alerts = btp.fetch_btp_alerts()
    with open('btp_alerts.json', 'w', encoding='utf-8') as f:
        json.dump(btp_alerts, f, ensure_ascii=False, indent=2)

    api_token = os.getenv('apify_api_key')
    if not api_token:
        raise EnvironmentError("apify_api_key environment variable not set.")
    scraper = scraper_instagram.InstagramScraper(api_token)
    n = 10
    k = 3
    hashtags = ["bangalorenews", "bengalurunews", "blrnow", "bengalurunow"]
    mention_results = scraper.find_mentions(n)
    hashtag_results = scraper.find_hashtags(hashtags, k)
    all_results = mention_results + hashtag_results
    json_output = scraper.format_results_as_json(all_results)
    with open('instagram.json', 'w', encoding='utf-8') as f:
        f.write(json_output)



def scrape_daily_services():

    bbmp_tenders = scraper_util1.scrape_bbmp_tenders()
    with open('bbmp_tenders.json', 'w', encoding='utf-8') as f:
        json.dump(bbmp_tenders, f, ensure_ascii=False, indent=2)

    utility_news = scraper_util2.fetch_bangalore_utility_news()
    with open('utility_news.json', 'w', encoding='utf-8') as f:
        json.dump(utility_news, f, ensure_ascii=False, indent=2)

    events = scraper_events.main()
    with open('events.json', 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

@app.post("/trigger-scrape/")
def trigger_scrape(mode: str = 'hourly'):
    if mode == 'hourly':
        scrape_hourly_services()
        return {"status": "Hourly scraping completed"}
    elif mode == 'daily':
        scrape_daily_services()
        return {"status": "Daily scraping completed"}
    else:
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'hourly' or 'daily'.")
