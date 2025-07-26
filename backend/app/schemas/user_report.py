from pydantic import BaseModel, AnyUrl
from typing import Annotated, List
from pydantic import Field

class Report(BaseModel):
    uid: str
    title:str
    description: str
    latitude: float
    longitude: float
    url:AnyUrl

class UserCreate(BaseModel):
    uid:str
    name:str
    phone_number:Annotated[int, Field(max_digits=10, min_length=10)]
    avatar_url:AnyUrl
    