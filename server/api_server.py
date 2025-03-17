from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from typing import Optional, List
import subprocess
import json
import logging
import sys
import traceback
from datetime import datetime

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'api_server_{datetime.now().strftime("%Y%m%d")}.log')
    ]
)

logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handling middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error": str(e)}
        )

class GenerationRequest(BaseModel):
    choice: str
    biome: str
    features: str
    constriction: str
    textStyle: str
    message: str

def build_prompt(request: GenerationRequest) -> str:
    """Build the prompt in the format expected by Ollama"""
    try:
        logger.info(f"Building prompt for request with choice: {request.choice}")
        prompt = f"<s>[INST] <<SYS>>\nI assume role as DM generating content with the following settings:\n\n"
        prompt += f"Choice:\n- {request.choice}\n\n"
        prompt += f"Biome:\n- {request.biome}\n\n"
        prompt += f"Features:\n- {request.features}\n\n"
        prompt += f"Constriction:\n- {request.constriction}\n\n"
        prompt += f"Text Style:\n- {request.textStyle}\n"
        prompt += f"<</SYS>>\n\n{request.message}\n\n"
        prompt += f"Style: {request.textStyle} [/INST]"
        logger.debug(f"Generated prompt: {prompt}")
        return prompt
    except Exception as e:
        logger.error(f"Error building prompt: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to build prompt")

def call_ollama(prompt: str) -> str:
    """Call Ollama API using curl command"""
    try:
        logger.info("Preparing to call Ollama API")
        # Prepare the curl command
        curl_command = [
            "curl",
            "-X",
            "POST",
            "http://localhost:11434/api/generate",
            "-d",
            json.dumps({
                "model": "llama2",
                "prompt": prompt,
                "stream": False
            })
        ]

        logger.debug(f"Executing curl command: {' '.join(curl_command)}")
        # Execute the command
        result = subprocess.run(curl_command, capture_output=True, text=True)

        if result.returncode != 0:
            error_msg = f"Ollama API error: {result.stderr}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        # Parse the response
        response = json.loads(result.stdout)
        logger.info("Successfully received response from Ollama")
        return response.get("response", "")

    except json.JSONDecodeError as e:
        error_msg = f"Failed to parse Ollama response: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Error calling Ollama: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/generate")
async def generate_content(request: GenerationRequest):
    """Handle generation requests from the frontend"""
    try:
        logger.info(f"Received generation request with choice: {request.choice}")

        # Build the prompt
        prompt = build_prompt(request)

        # Call Ollama
        response = call_ollama(prompt)

        logger.info("Successfully generated content")
        return {
            "success": True,
            "response": response
        }

    except ValidationError as e:
        error_msg = f"Validation error: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except HTTPException as he:
        raise he
    except Exception as e:
        error_msg = f"Generation error: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
