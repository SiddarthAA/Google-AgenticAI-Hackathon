from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager
import firebase_admin
from firebase_admin import firestore_async, credentials
import argparse 
from app.api.user_report import router as user_report_router
from app.settings import firestore_database_id

db=None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize resources here, e.g., database connections
    
    global db
    firebase_app=firebase_admin.initialize_app()
    # cred=credentials.Certificate("./radio-jockey/credentials/sonic-momentum-466216-f9-firebase-adminsdk-fbsvc-324a8e9923.json")
    db=firestore_async.client(firebase_app, database_id=firestore_database_id)
    yield
    print("shutting down")
    
    
app = FastAPI(lifespan=lifespan)

def get_firebase_db():
    global db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return db


app.include_router(user_report_router)    

