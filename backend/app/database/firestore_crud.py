from google.cloud.firestore_v1 import AsyncClient
from google.cloud.firestore_v1.types import WriteResult




async def upload_to_firestore(data:dict, db:AsyncClient):

    print(f"File {data} not found. Using provided data as string.")
        
    response:WriteResult=await db.collection("events").document().set(data)
    
    print(f"Data {data} uploaded to Firestore." + f"response:{response}")


