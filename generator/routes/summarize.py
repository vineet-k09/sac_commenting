from fastapi import APIRouter
from app.models import CommentRequest
from app.services.gemini_service import run_gemini

router = APIRouter()

@router.post("/summarize")
async def summarize_comment(req: CommentRequest):
    prompt = f"""
    You are a professional editor.
    Summarize the following user comment into ONE concise, polished statement.
    Correct grammar and spelling, and make it professional.
    Do not change the meaning. Do not provide multiple options.

    User Comment:
    {req.user_comment}
    """
    return {"comment": run_gemini(prompt)}