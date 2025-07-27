import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api = os.getenv("GEMINI_API_KEY")

def get_schema(raw_content: str) -> dict:
    try:
        with open("schemas/schema-prompt.txt", "r") as f:
            schema_prompt_template = f.read()
    except FileNotFoundError:
        print("Error: schema-prompt.txt not found. Please ensure it's in the same directory as get-schema.py")
        return {}

    full_prompt = schema_prompt_template.replace("{raw}", raw_content)

    genai.configure(api_key=api)
    model = genai.GenerativeModel("gemini-2.5-flash")

    try:
        response = model.generate_content(
            contents=full_prompt
        )

        json_object = json.loads(response.text[7:-3])
        return json_object
    
    except Exception as e:
        print(f"An error occurred during content generation or JSON parsing: {e}")
        return False
        return {}

if __name__ == "__main__":
    raw_example_content = """
    Insert News Here / JSON RAW OBJECT!
    """
    test = """
Book Launch of Into the Leopard’s Den by Harini Nagendra, in conversation with Ramjee Chandran | Champaca, Vasanth Nagar | 27 July, 6:00PM
July 4, 2025 • book discussion • events in bangalore

We’re delighted to invite you to the launch of INTO THE LEOPARD’S DEN by Harini Nagendra, the much-awaited continuation of the beloved BANGALORE DETECTIVES CLUB series. Harini will be in conversation with writer and podcaster Ramjee Chandran.

Here are the event details:

Date: 27 July 2025, Sunday

Time: 6:00PM

Venue: Champaca Bookstore, Vasanth Nagar ( Champaca is accessible only by stairs)

Since there is limited seating, we recommend that you RSVP to confirm your spot!

About the book:

Set in 1920s Bangalore and the misty hills of Coorg, INTO THE LEOPARD’S DEN follows amateur detective Kaveri Murthy as she faces her most intricate investigation yet. Confined to her home due to pregnancy and her mother-in-law’s watchful eye, Kaveri is drawn back into sleuthing when an elderly woman dies clutching a photograph of her and pleading for help. What begins as a single murder leads her into a tangled web of secrets stretching from Bangalore’s bungalows to Coorg’s coffee plantations. With her husband Ramu away in Coorg, and aided by her loyal companions Venu and Anandi, Kaveri uncovers sinister happenings involving a ghost leopard, an attempt on the life of the Coffee King of Coorg, and multiple murders. Emotionally invested after a plea from two vulnerable children, Kaveri races against time to stop a cold-blooded killer in this gripping continuation of THE BANGALORE DETECTIVES CLUB series.

About the Speakers:

Harini Nagendra, a professor of ecology at Azim Premji University, is a well-respected scholar on sustainability. Her impressive body of work includes the award-winning NATURE IN THE CITY: BENGALURU IN THE PAST, PRESENT, AND FUTURE, and co-authored books like CITIES AND CANOPIES: TREES IN INDIAN CITIES, which won the 2020 Publishing Next Award for Best Non-Fiction Book. Harini’s work has been internationally recognised, and she has made an indelible impact on both academic circles and the general public. Her debut crime novel, THE BANGALORE DETECTIVES CLUB, has been followed by sequels, including MURDER UNDER A RED MOON and A NEST OF VIPERS, and now is the new book which is a continuation.

Ramjee Chandran is a journalist, author, and media entrepreneur. He is the host of THE LITERARY CITY podcast — featuring conversations with acclaimed writers, and THE HISTORY OF BANGALORE podcast. A long-time magazine publisher and writer, he brings decades of experience to his fiction. He is currently working on his next book, THE HISTORY OF BANGALORE, a meticulously researched narrative tracing the region’s history from prehistoric times to the present. He also plays jazz guitar at the professional level. He recently released a book titled FOR NO REASON AT ALL.
"""
    schema_result = get_schema(test)
    if schema_result:
        print(json.dumps(schema_result, indent=2))