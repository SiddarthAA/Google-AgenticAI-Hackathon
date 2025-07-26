import requests
from bs4 import BeautifulSoup
import json

# URL of the page you want to scrape
url = "https://www.eventbrite.com/d/india--bangalore/events/"

# Send a GET request to fetch the raw HTML content
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
response = requests.get(url, headers=headers)

# Parse the content using BeautifulSoup
soup = BeautifulSoup(response.content, 'html.parser')

# Find all 'a' tags with class 'event-card-link'
event_links = soup.find_all('a', class_='event-card-link')

# List to hold all events data
events_data = []

# Loop through the found links and extract the event title, time, location, and URL
for link in event_links:
    # Extract the event URL (href attribute)
    event_url = link.get('href')
    
    # Find the h3 tag within the link to get the event title
    h3_tag = link.find('h3', class_='Typography_root__487rx')
    
    # Find the <p> tag containing event time
    time_tag = link.find_next('p', class_='Typography_root__487rx #3a3247 Typography_body-md-bold__487rx Typography_align-match-parent__487rx')
    
    # Find the <p> tag containing event location
    location_tag = link.find_next('p', class_='Typography_root__487rx #585163 Typography_body-md__487rx event-card__clamp-line--one Typography_align-match-parent__487rx')

    # Extract and clean the event time if found
    if time_tag:
        event_time = time_tag.get_text(strip=True)
    else:
        event_time = "N/A"  # Default if no time is found

    # Extract and clean the event location if found
    if location_tag:
        event_location = location_tag.get_text(strip=True)
    else:
        event_location = "N/A"  # Default if no location is found

    # Format the event time and date separately
    if event_time != "N/A":
        # Separate the day (e.g., Sun, Sep 21) and time (e.g., 10:30 AM)
        time_parts = event_time.split('•')
        date_part = time_parts[0].strip() if len(time_parts) > 0 else "N/A"
        time_part = time_parts[1].strip() if len(time_parts) > 1 else "N/A"
        
        # Format the time
        formatted_time = time_part
        formatted_date = date_part
    else:
        formatted_time = "N/A"
        formatted_date = "N/A"
    
    # Check if the title is not "N/A"
    if h3_tag and h3_tag.get_text(strip=True) != "N/A":
        # Prepare event data as a dictionary
        event_data = {
            "event_title": h3_tag.get_text(strip=True),
            "event_url": event_url,
            "event_time": formatted_time,
            "event_date": formatted_date,
            "event_location": event_location
        }
        
        # Add event data to the events list
        events_data.append(event_data)

# Convert the list of events to JSON format and print it
json_data = json.dumps(events_data, indent=4)
print(json_data)

print("done")
