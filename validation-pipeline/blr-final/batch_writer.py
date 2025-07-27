
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

def batch_write_to_firestore(json_data_array: list[dict], collection_name: str="event"):
    """
    Performs batched writes of a list of JSON objects to a Firestore collection.

    Args:
        json_data_array: A list of dictionaries (JSON objects) to be written.
        collection_name: The name of the Firestore collection.
    """
    try:
        # Initialize the app without credentials as requested by the user.
        # WARNING: This is generally NOT recommended for production environments
        # as it relies on Application Default Credentials (ADC) or environment variables.
        # For production, explicitly provide credentials.
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app()

    db = firestore.client(database_id="bangalorenow")
    batch = db.batch()
    
    for data in json_data_array:
        doc_ref = db.collection(collection_name).document()
        batch.set(doc_ref, data)
    
    batch.commit()
    print(f"Successfully committed {len(json_data_array)} documents to collection '{collection_name}'.")

if __name__ == '__main__':
    # Example Usage:
    sample_data = [
        {"name": "Event 1", "location": "Venue A", "date": "2025-01-01"},
    ]
    
    # To run this example, ensure you have the firebase-admin SDK installed
    # and your environment is set up for Application Default Credentials (ADC)
    # or you are running within a Google Cloud environment.
    # For local testing, you might need to set the GOOGLE_APPLICATION_CREDENTIALS
    # environment variable to the path of your service account key file.
    
    batch_write_to_firestore(sample_data, "events")
    print("Uncomment the batch_write_to_firestore call to run the example.")
    print("Remember to set up your Firebase credentials or ADC for actual writes.")
