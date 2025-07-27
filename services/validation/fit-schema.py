import json
from google import genai

def fit_data_to_schema(raw_data: str, prompt_path: str = "prompts/prompt-1.txt") -> dict:
    """
    Reads a prompt with a {raw} placeholder, replaces it with raw_data (string),
    and calls Gemini API to fit the data into the defined schema.
    """
    # Initialize Gemini client
    client = genai.Client(api_key="AIzaSyCgyj9oJr44xupdBGIrfaQHpodeDBD6loU")

    # Read the prompt template
    with open(prompt_path, "r", encoding="utf-8") as f:
        prompt_template = f.read()

    # Replace {raw} placeholder with raw_data string
    formatted_prompt = prompt_template.replace("{raw}", raw_data)

    # Call Gemini API
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=formatted_prompt
    )
    response = response.text[7:-4]

    # Attempt to parse the output as JSON
    try:
        return json.loads(response)
    except Exception:
        return {"error": "Invalid JSON returned", "raw_response": response.text}


# Example usage
if __name__ == "__main__":
    example_raw_data = """
"title": "No Cost On-Line Coursera Certification Courses For Military and Spouse",
        "description": "",
        "date": "Monday 9:30 AM PDT",
        "location": "ITC Gardenia, a Luxury Collection Hotel, Bengaluru",
        "url": "https://www.eventbrite.com/e/no-cost-on-line-coursera-certification-courses-for-military-and-spouse-tickets-165655358637?aff=ebdssbcitybrowse",
        "source": "Eventbrite",
        "scraped_at": "2025-07-26T16:49:27.965942+00:00"
    """
    result = fit_data_to_schema(example_raw_data)
    print(result)