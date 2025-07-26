from fastapi import APIRouter, status, HTTPException, Form, Request
from typing import Annotated
from app.schemas.user_report import Report
from fastapi import BackgroundTasks
from app.pub_sub_functions import publish_report_to_pubsub


router=APIRouter(tags=["user_report"], )

@router.post("/register/user", status_code=status.HTTP_201_CREATED)
async def create_user(user_data:)

@router.post("/send-report", status_code=status.HTTP_201_CREATED)
async def create_report(Request:Request, Report:Annotated[Report, Form()], background_tasks:BackgroundTasks):
    """
    Create a new user report.
    """
    try:
        background_tasks.add_task(publish_report_to_pubsub, Report)
        return {"message": "Report recieved", "report": Report}
    except Exception as e:  
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
