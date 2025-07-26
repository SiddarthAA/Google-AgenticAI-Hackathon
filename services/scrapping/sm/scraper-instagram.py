import json
from apify_client import ApifyClient

class InstagramScraper:
    def __init__(self, api_token):
        self.client = ApifyClient("apify_api_bLWUs4dQnkjztqDT49BL6gFoPVpaZa07P3CC")
        self.mention_account = "blr.now" 

    #Finding n number of mentions of @blr.now
    def find_mentions(self, n):
        print(f"Searching for posts from: @{self.mention_account}")
        run_input = {
            "username": [self.mention_account],
            "resultsLimit": n,
        }
        try:
            run = self.client.actor("zTSjdcGqjg6KEIBlt").call(run_input=run_input)
            dataset_items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())
            for item in dataset_items:
                item['source_type'] = 'mention'
                item['search_term'] = f"@{self.mention_account}"
            return dataset_items
        except Exception as e:
            print(f"Error processing @{self.mention_account}: {str(e)}")
            return []

    #finding k number of posts for each hashtag in hashtags
    def find_hashtags(self, hashtags, k):
        all_results = []
        for hashtag in hashtags:
            print(f"Searching for: #{hashtag}")
            run_input = {
                "hashtags": [hashtag],
                "resultsType": "posts",
                "resultsLimit": k,
            }
            try:
                run = self.client.actor("reGe1ST3OBgYZSsZJ").call(run_input=run_input)
                dataset_items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())
                for item in dataset_items:
                    item['source_type'] = 'hashtag'
                    item['search_term'] = f"#{hashtag}"
                all_results.extend(dataset_items)
                print(f"Found {len(dataset_items)} posts for #{hashtag}")
            except Exception as e:
                print(f"Error processing #{hashtag}: {str(e)}")
        return all_results

    #json formatting of output
    def format_results_as_json(self, results):
        main_json = {
            "total_events": len(results),
            "events": results
        }
        json_string = json.dumps(main_json, indent=2, ensure_ascii=False)
        return json_string

def main():
    print("Starting Instagram search for @blr.now posts and hashtags...")
    print("-" * 60)
    api_token = "apify_api_bLWUs4dQnkjztqDT49BL6gFoPVpaZa07P3CC"
    scraper = InstagramScraper(api_token)

    try:
        n = int(input("Enter the number of results per search for mentions: ").strip())
    except Exception:
        print("Invalid input for n. Using default value 3.")
        n = 3

    try:
        k = int(input("Enter the number of results per search for hashtags : ").strip())
    except Exception:
        print("Invalid input for n. Using default value 3.")
        k = 3

    hashtags_input = input("Enter hashtags to search for (comma separated, without #): ").strip()
    if hashtags_input:
        hashtags = [h.strip() for h in hashtags_input.split(",") if h.strip()]
    else:
        hashtags = ["bangalorenews", "bengalurunews", "blrnow", "bengalurunow"]

    mention_results = scraper.find_mentions(n)
    hashtag_results = scraper.find_hashtags(hashtags, k)
    all_results = mention_results + hashtag_results

    if all_results:
        json_output = scraper.format_results_as_json(all_results)
        print(f"\nTotal mention results: {len(mention_results)}")
        print(f"Total hashtag results: {len(hashtag_results)}")
        print(f"Total combined items: {len(all_results)}")
        print("\n" + "="*50)
        print("COMBINED JSON OUTPUT:")
        print("="*50)
        print(json_output)
        return json_output
    else:
        print("No content found from either mentions or hashtags.")
        return json.dumps({"total_events": 0, "events": []})

if __name__ == "__main__":
    json_result = main()