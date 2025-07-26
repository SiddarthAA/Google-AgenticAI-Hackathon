from app.settings import google_cloud_project_id, topic_name
import json
from google.pubsub_v1.types import PubsubMessage,PublishResponse
from google.pubsub_v1 import PublisherClient
from fastapi import HTTPException, status
from app.schemas.user_report import Report
from logging import Logger

def publish_report_to_pubsub(Report:Report):
        publisher=PublisherClient()
        if not google_cloud_project_id or not topic_name:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google Cloud settings are not configured.")
        
        topic_path=publisher.topic_path(google_cloud_project_id, topic_name)
        future=publisher.publish(
            topic=topic_path,
            messages=[(PubsubMessage(data=Report.model_dump_json().encode('utf-8')))]
            
        )
        print("Data published")
        return