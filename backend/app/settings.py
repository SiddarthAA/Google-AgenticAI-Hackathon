import os
from dotenv import load_dotenv
load_dotenv()

google_cloud_project_id=os.getenv("GOOGLE_CLOUD_PROJECT_ID")
topic_name=os.getenv("TOPIC_NAME")
firestore_database_id=os.getenv("FIRESTORE_DATABASE_ID", "events")
