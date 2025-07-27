data = [
  {
    "title": "Bangalore Bandh today: Cabs, autorickshaws, private buses to go off ...",
    "description": "Bangalorebandh: Private buses, autorickshaws, app cabs, goods vehicles, and buses attached to schools, corporate houses, and garment factories, among others, might stay off the roads owing to thestrike.",
    "date": "2025-07-27",
    "location": "Bangalore",
    "url": "//duckduckgo.com/l/?uddg=https%3A%2F%2Findianexpress.com%2Farticle%2Fcities%2Fbangalore%2Fprivate%2Dbuses%2Dautorickshaws%2Dcabs%2Dto%2Dstrike%2Din%2Dbengaluru%2D8933667%2F&rut=82a5c9ca8fa27173fe5106e0a717c4a86c3bc7c15f451bc86d79ee5f4167f4c0",
    "source": "DuckDuckGo Search",
    "scraped_at": "2025-07-27T04:07:31.730802+00:00",
    "relevance_score": 7.5
  },
  {
    "title": "Bharat Bandh Today news: Trade Unions Protest Against Anti-Worker ...",
    "description": "Bharat Bandh Today news updatesJuly9, Trade unions across sectors, including banking, insurance, and construction, call for a Bharat Bandh today. However, essential services and transport in ...",
    "date": "2025-07-27",
    "location": "Bangalore",
    "url": "//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.deccanherald.com%2Findia%2Fbharat%2Dbandh%2Dcalled%2Dby%2Dtrade%2Dunions%2Dtoday%2D3621510&rut=30ee633bc0b348804013e641eff47fe881f17d29490a6d8489eb81710e4c5eec",
    "source": "DuckDuckGo Search",
    "scraped_at": "2025-07-27T04:07:30.685125+00:00",
    "relevance_score": 6.5
  },
  {
    "title": "Private transporters' strike: Cabs, buses to be off road today; BMTC to ...",
    "description": "Bengaluru commuters to face disruption on Monday due to transportstrike. Private buses, cabs, auto-rickshaws to stay off roads.BMTCto run 500 extra trips to ensure public convenience. Private ...",
    "date": "2025-07-27",
    "location": "Bangalore",
    "url": "//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.thehindu.com%2Fnews%2Fnational%2Fkarnataka%2Fbengaluru%2Dbandh%2Dcabs%2Dprivate%2Dbuses%2Dto%2Dbe%2Doff%2Droad%2Dtoday%2Dbmtc%2Dto%2Drun%2D500%2Dextra%2Dschedules%2Farticle67291879.ece&rut=aa284f386725d460afa5b646bfddbefd53eac8a533f1f87818976be6a66973bf",
    "source": "DuckDuckGo Search",
    "scraped_at": "2025-07-27T04:07:31.488962+00:00",
    "relevance_score": 6.5
  },
  {
    "title": "Bengaluru Power Cut on July 26: These Areas to Face 6-Hour ... - Oneindia",
    "description": "Bengaluru to facepowercuton July 26 due toBESCOMmaintenance. Online services across five ESCOMs will also be down from July 25 to July 27.",
    "date": "2025-07-27",
    "location": "Bangalore",
    "url": "//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.oneindia.com%2Fbengaluru%2Fbengaluru%2Dpower%2Dcut%2Don%2Djuly%2D26%2Dbescom%2Dto%2Dcut%2Dpower%2Din%2Dthese%2Dareas%2Dfor%2D6%2Dhours%2D7809473.html&rut=369c766147c80bf7855089a7c688f7466832695f96866180c4bfaf8b30734f00",
    "source": "DuckDuckGo Search",
    "scraped_at": "2025-07-27T04:07:27.489680+00:00",
    "relevance_score": 5.0
  },
  {
    "title": "Bengaluru Power Cut Today: No Electricity in These Areas ... - Oneindia",
    "description": "According to a press release fromBangaloreElectricity Supply Company Limited (BESCOM), a wide range of areas will be affected by thepowercut. Residents in the following locations should plan ...",
    "date": "2025-07-27",
    "location": "Bangalore",
    "url": "//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.oneindia.com%2Fbengaluru%2Fbengaluru%2Dpower%2Dcut%2Dtoday%2Dno%2Delectricity%2Din%2Dthese%2Dareas%2Dcheck%2Dif%2Dyour%2Darea%2Dis%2Daffected%2D3968753.html&rut=4d71f53ae3135cef38a2dd55d09403caffd175eee37d769e43cdffec063bbb76",
    "source": "DuckDuckGo Search",
    "scraped_at": "2025-07-27T04:07:27.489680+00:00",
    "relevance_score": 4.5
  },
  {
    "title": "Bengaluru to face disruption in water supply today: Here's the full ...",
    "description": "Bengaluru city will face disruption inwatersupply for a 24-hour period starting 6 am Tuesday, February 27 to 6 am of February 28. According to a release byBangaloreWaterSupply and Sewerage Board, several parts of the city will face disruption due to the complete shutdown of Cauvery fourth stage second phasewatersupply line.",
    "date": "2025-07-27",
    "location": "Bangalore",
    "url": "//duckduckgo.com/l/?uddg=https%3A%2F%2Findianexpress.com%2Farticle%2Fcities%2Fbangalore%2Fwater%2Dsupply%2Dcut%2Dbangalore%2Dareas%2Dfeb%2D27%2D9182266%2F&rut=c6e80537b6fff1ade3a4928ec5659171e02e047947757d97dc4e3c3c7c61384b",
    "source": "DuckDuckGo Search",
    "scraped_at": "2025-07-27T04:07:29.405663+00:00",
    "relevance_score": 3.5
  }
]

import json 
from schema import get_schema
import base64
from vector import VectorDBManager
from batch_writer import batch_write_to_firestore
from dotenv import load_dotenv

load_dotenv()
try: 
    index = VectorDBManager()
except Exception as e:
    pass

if data:
    # Decode the base64 encoded data
    decoded_data = data #-> list of jsons
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
        
        #cords = geocode_location(schema['location']['name'])
        cords = [12.9716, 77.5946]
        if "hash" in schema:
            del schema["hash"]
        if "validity" in schema:
            del schema["validity"]
        if "entities" in schema:
            del schema['entities']
        if "nid" in schema:
            del schema['nid']
        if "media" in schema:
            del schema['media']
        schema['location']['latitude'] = cords[0]
        schema['location']['longitude'] = cords[1]
    
        batch.append(schema)
        if len(batch) >= 6:
            batch_write_to_firestore(batch, "events")
            batch = []
    
    if batch:
        batch_write_to_firestore(batch, "events")
        

else:
    decoded_data = {}