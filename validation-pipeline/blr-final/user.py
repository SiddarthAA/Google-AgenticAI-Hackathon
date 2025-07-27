import google.generativeai as genai
import json
import os

# --- Configuration ---
# IMPORTANT: Replace "YOUR_GEMINI_API_KEY" with your actual Google AI Studio API key.
# For better security, it's recommended to load the key from an environment variable.
# For example: genai.configure(api_key=os.environ["GEMINI_API_KEY"])
API_KEY = "YOUR_GEMINI_API_KEY"
if API_KEY == "YOUR_GEMINI_API_KEY":
    print("Warning: API key is not set. Please replace 'YOUR_GEMINI_API_KEY' in user.py with your actual key.")
    # Exit if the key is not set, to prevent errors.
    # In a real application, you might handle this more gracefully.
    # For this script, we will allow it to proceed but expect an authentication error.
    pass

genai.configure(api_key=API_KEY)


# --- Model and Prompt Loading ---
try:
    # Load the detailed schema transformation prompt from the specified file
    with open('/home/sidd/Desktop/blr-final/schemas/schema-prompt.txt', 'r') as f:
        SCHEMA_PROMPT_TEMPLATE = f.read()
except FileNotFoundError:
    print("Error: The required prompt file 'schemas/schema-prompt.txt' was not found.")
    SCHEMA_PROMPT_TEMPLATE = "" # Set a default to avoid crashing the script

# Initialize the Gemini 1.5 Flash model
model = genai.GenerativeModel('gemini-1.5-flash')


def is_content_valid(data: dict, image_url: str) -> bool:
    """
    Uses Gemini to perform a moderation check on the user's input.

    Args:
        data: The JSON data submitted by the user.
        image_url: The URL of the image submitted by the user.

    Returns:
        True if the content is deemed valid, False otherwise.
    """
    if not data and not image_url:
        return False

    # A simple prompt for the moderation check
    validation_prompt = f"""
    You are a content moderator for a local news platform.
    Your task is to determine if the submitted content is a genuine report
    (e.g., about traffic, weather, local events, infrastructure issues).

    Respond with ONLY the word 'VALID' if the content is a genuine report.
    Respond with ONLY the word 'INVALID' if the content is spam, nonsensical,
    abusive, hateful, or completely irrelevant to local news.

    ---
    User Data: {json.dumps(data)}
    Image URL: "{image_url}"
    ---

    Decision:
    """
    try:
        response = model.generate_content(validation_prompt)
        decision = response.text.strip().upper()
        print(f"Moderation check result: {decision}")
        return decision == 'VALID'
    except Exception as e:
        print(f"An error occurred during content validation: {e}")
        return False

def transform_to_schema(data: dict, image_url: str) -> dict | None:
    """
    Transforms the user's input into the structured schema using Gemini.

    Args:
        data: The JSON data submitted by the user.
        image_url: The URL of the image submitted by the user.

    Returns:
        A dictionary conforming to the schema, or None if an error occurs.
    """
    if not SCHEMA_PROMPT_TEMPLATE:
        print("Cannot proceed without the schema prompt template.")
        return None

    # Combine the input data and image URL to form the "raw" content
    raw_content = {
        "user_report": data,
        "media_url": image_url
    }

    # Fill the prompt template with the raw content
    final_prompt = SCHEMA_PROMPT_TEMPLATE.replace('{raw}', json.dumps(raw_content, indent=2))

    print("Sending content to Gemini for schema transformation...")
    try:
        response = model.generate_content(final_prompt)
        # Clean up the response to ensure it's a valid JSON string
        cleaned_response = response.text.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]

        # Parse the JSON string into a Python dictionary
        structured_data = json.loads(cleaned_response)
        print("Schema transformation successful.")
        return structured_data
    except json.JSONDecodeError:
        print("\nError: Failed to decode JSON from the model's response.")
        print("Model Response Text:\n", response.text)
        return None
    except Exception as e:
        print(f"\nAn error occurred during schema transformation: {e}")
        return None

def process_user_submission(json_data: dict, image_url: str):
    """
    Main function to orchestrate the validation and transformation process.
    """
    print("Step 1: Starting content validation...")
    if not is_content_valid(json_data, image_url):
        print("Validation Failed: The submitted content was flagged as invalid.")
        return

    print("\nStep 2: Validation successful. Proceeding to schema transformation.")
    structured_output = transform_to_schema(json_data, image_url)

    if structured_output:
        print("\n--- Final Structured Output ---")
        print(json.dumps(structured_output, indent=2))
        print("---------------------------------")
    else:
        print("\nProcess failed during schema transformation.")


if __name__ == '__main__':
    # --- Example Usage ---

    # Example 1: A valid user report about a traffic jam
    print("--- Running Example 1: Valid Report ---")
    report_1_data = {
        "user_id": "user_582",
        "report_text": "There is a massive traffic jam on the Outer Ring Road near Marathahalli. A truck has broken down in the middle of the road.",
        "location_details": "ORR, near Marathahalli bridge, Bangalore"
    }
    report_1_image = "https://some-image-host.com/images/marathahalli_traffic.jpg"
    process_user_submission(report_1_data, report_1_image)

    print("\n"+"="*60+"\n")

    # Example 2: An invalid or useless user report
    print("--- Running Example 2: Invalid Report ---")
    report_2_data = {
        "user": "spam_user_99",
        "message": "hey check out my new website for cheap stuff!! link in bio"
    }
    report_2_image = "" # No image provided
    process_user_submission(report_2_data, report_2_image)
