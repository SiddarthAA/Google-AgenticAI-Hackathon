from fastapi import FastAPI, Request
import json
import os
import base64
from dotenv import load_dotenv

#from geocoder import geocode_location
#os.environ["GOOGLE_MAPS_API_KEY"] = "api"

from schema import get_schema
from vector import VectorDBManager
from batch_writer import batch_write_to_firestore

load_dotenv()
app = FastAPI()

try:
    index = VectorDBManager()
except Exception as e:
    pass 

@app.post("/aiworkflow_subscriber",status_code=200)
async def aiworkflow_subscriber(request: Request):
    envelope = await request.json()
    
    message = envelope.get("message")
    if not message:
        return {"status": "error", "message": "No message found in the Pub/Sub envelope"}, 400

    data = message.get("data")
    attributes = message.get("attributes")
    message_id = message.get("messageId")
    publish_time = message.get("publishTime")

    if data:
        decoded_data = json.loads(data)
        batch = []
        for news in decoded_data:
            raw = str(news)
            schema = get_schema(raw)

            if schema == False: 
                continue
                
            if (schema["validity"]["final_weighted_score"] >.75): 
                try: 
                    if index._load_existing_entries() or index._find_closest_matching_in_memory(): 
                        pass
                    else :
                        index._add_to_vector_index(schema['hash']['embedding'])
                except: 
                    pass 
            
            cords = [123.456, 78.910]  # Placeholder for geocode_location(schema['location']['name'])
            
            del schema["hash"]
            del schema["validity"]
            del schema['entities']
            del schema['nid']
            del schema['media']
            schema['location']['latitude'] = cords[0]
            schema['location']['longitude'] = cords[1]
        
            batch.append(schema)
            if len(batch) >= 50:
                batch_write_to_firestore(batch, "events")
                batch = []
        
        if batch:
            batch_write_to_firestore(batch, "events")
            

    else:
        decoded_data = {}

    return {
        "status": "success",
        "message_id": message_id,
        "publish_time": publish_time,
        "attributes": attributes,
        "data": decoded_data
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)