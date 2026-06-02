import os
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig

PROJECT_ID = os.getenv("PROJECT_ID", "vf-grp-aib-prd-mc2-in-lab")
REGION = os.getenv("REGION", "europe-west1")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash-lite")

vertexai.init(project=PROJECT_ID, location=REGION)
model = GenerativeModel(MODEL_NAME)

def run_gemini(prompt: str) -> str:
    response = model.generate_content(
        prompt,
        generation_config=GenerationConfig(max_output_tokens=512, temperature=0.2)
    )
    return response.text.strip()