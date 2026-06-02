from fastapi import APIRouter
from app.models import CommentRequest
from app.services.gemini_service import run_gemini

router = APIRouter()

@router.post("/rephrase")
async def rephrase_comment(req: CommentRequest):
    prompt = f"""
    You are a professional editor.
    Rephrase the following user comment into ONE polished version.
    Correct grammar and spelling, and make it professional.
    Do not change the meaning. Do not provide multiple options.

    User Comment:
    {req.user_comment}
    """
    return {"comment": run_gemini(prompt)}