from pydantic import BaseModel

class CommentRequest(BaseModel):
    user_comment: str