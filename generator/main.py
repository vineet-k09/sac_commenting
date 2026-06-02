from fastapi import FastAPI
from app.routes import rephrase, summarize

app = FastAPI()

app.include_router(rephrase.router)
app.include_router(summarize.router)