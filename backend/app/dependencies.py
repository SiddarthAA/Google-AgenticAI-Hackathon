import firebase_admin
from firebase_admin import firestore_async, credentials
import argparse 



app=firebase_admin.initialize_app()
# cred=credentials.Certificate("./radio-jockey/credentials/sonic-momentum-466216-f9-firebase-adminsdk-fbsvc-324a8e9923.json")

db=firestore_async.client(app, database_id="agentic-news")
