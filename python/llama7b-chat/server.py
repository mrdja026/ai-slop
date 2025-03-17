from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from typing import Optional, List
import logging
import sys
import traceback
from datetime import datetime
import time
import json
import subprocess
import os

# Configure logging with detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(funcName)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'llama_server_{datetime.now().strftime("%Y%m%d")}.log')
    ]
)

logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerationRequest(BaseModel):
    prompt: str
    system_message: str

class ImageGenerationRequest(BaseModel):
    prompt: str
    negative_prompt: str = "blurry, low quality, distorted, deformed, disfigured, bad anatomy, ugly, duplicate, error"
    num_steps: int = 30
    guidance_scale: float = 7.5
    height: int = 768
    width: int = 512

def build_prompt(system_msg: str, user_prompt: str) -> str:
    """Build the prompt in Llama 2 chat format"""
    try:
        # Split system_msg into components if it contains them
        components = system_msg.split('\n\n')

        # Initialize default values
        choice = ""
        biome = ""
        features = ""
        constriction = ""
        text_style = ""

        # Parse components if they exist
        for component in components:
            if component.startswith("Choice:"):
                choice = component.replace("Choice:", "").strip()
                logger.debug(f"Parsed Choice: '{choice}'")
            elif component.startswith("Biome:"):
                biome = component.replace("Biome:", "").strip()
                logger.debug(f"Parsed Biome: '{biome}'")
            elif component.startswith("Features:"):
                features = component.replace("Features:", "").strip()
                logger.debug(f"Parsed Features: '{features}'")
            elif component.startswith("Constriction:"):
                constriction = component.replace("Constriction:", "").strip()
                logger.debug(f"Parsed Constriction: '{constriction}'")
            elif component.startswith("Text Style:"):
                text_style = component.replace("Text Style:", "").strip()
                logger.debug(f"Parsed Text Style: '{text_style}'")

        # Validate components
        missing_components = []
        if not choice or choice == "- null":
            missing_components.append("Choice")
        if not biome or biome == "- null":
            missing_components.append("Biome")
        if not features or features == "- null":
            missing_components.append("Features")
        if not text_style or text_style == "- null":
            missing_components.append("Text Style")

        if missing_components:
            logger.warning(f"Missing or invalid components: {', '.join(missing_components)}")

        # Build the prompt in the exact format requested
        prompt = f"<s>[INST] <<SYS>>\nI assume role as DM generating content with the following settings:\n\n"
        prompt += f"Choice:\n- {choice}\n\n"
        prompt += f"Biome:\n- {biome}\n\n"
        prompt += f"Features:\n- {features}\n\n"
        prompt += f"Constriction:\n- {constriction}\n\n"
        prompt += f"Text Style:\n- {text_style}\n"
        prompt += f"<</SYS>>\n\n{user_prompt}\n\n"
        prompt += f"Style: {text_style} [/INST]"

        logger.debug(f"Built prompt_DEBUG: {prompt}")
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
                "stream": False,
                "options": {
                    "temperature": 0.85,
                    "top_p": 0.95,
                    "top_k": 40,
                    "num_predict": 512,
                    "repeat_penalty": 1.15,
                    "seed": -1
                }
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
    """Handle generation requests"""
    try:
        logger.info("="*50)
        logger.info("Starting new generation request")
        logger.info(f"System message: {request.system_message}")
        logger.info(f"User prompt: {request.prompt}")

        start_time = time.time()

        # Build the prompt using the same format as generate-actor-method-request.py
        formatted_prompt = build_prompt(request.system_message, request.prompt)
        logger.info("Built formatted prompt")

        # Generate response using Ollama
        logger.info("Starting text generation with Ollama...")
        response_text = call_ollama(formatted_prompt)
        logger.info("Text generation completed")

        generation_time = time.time() - start_time

        # Log the response
        logger.info(f"Generated response: {response_text}")
        logger.info(f"Generation completed in {generation_time:.2f} seconds")
        logger.info("="*50)

        return {
            "success": True,
            "response": response_text,
            "generation_time": f"{generation_time:.2f}s",
            "logs": {
                "generation_time": generation_time,
                "timestamp": datetime.now().isoformat()
            }
        }

    except Exception as e:
        error_msg = f"Generation error: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        logger.error("="*50)
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if Ollama is running and get version
        result = subprocess.run(["curl", "http://localhost:11434/api/version"],
                              capture_output=True, text=True)
        ollama_status = result.returncode == 0

        health_status = {
            "status": "healthy" if ollama_status else "unhealthy",
            "ollama_running": ollama_status,
            "timestamp": datetime.now().isoformat()
        }

        if ollama_status:
            version_info = json.loads(result.stdout)
            health_status["ollama_version"] = version_info.get("version", "unknown")
            logger.info(f"Ollama version: {version_info.get('version')}")

        logger.info(f"Health check: {json.dumps(health_status, indent=2)}")
        return health_status
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/generate-image")
async def generate_image(request: ImageGenerationRequest):
    """Generate an image using the Stable Diffusion model"""
    try:
        logger.info("="*50)
        logger.info("Starting image generation request")
        logger.info(f"Prompt: {request.prompt}")
        logger.info(f"Parameters: steps={request.num_steps}, guidance={request.guidance_scale}, size={request.height}x{request.width}")

        # Get absolute paths
        current_dir = os.path.dirname(os.path.abspath(__file__))
        script_path = os.path.abspath(os.path.join(current_dir, "..", "image-generation", "generate-stable-fusion.py"))
        output_dir = os.path.abspath(os.path.join(current_dir, "..", "image-generation", "outputs", "generated_images"))

        # Verify script exists
        if not os.path.exists(script_path):
            error_msg = f"Image generation script not found at: {script_path}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Generate a unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = os.path.abspath(os.path.join(output_dir, f"generated_{timestamp}.png"))

        logger.info(f"Script path: {script_path}")
        logger.info(f"Output file: {output_file}")

        # Build the command with all parameters
        command = [
            sys.executable,
            script_path,
            "--single_image",
            "--prompt", request.prompt,
            "--negative_prompt", request.negative_prompt,
            "--num_steps", str(request.num_steps),
            "--guidance_scale", str(request.guidance_scale),
            "--height", str(request.height),
            "--width", str(request.width),
            "--output_file", output_file,
            "--return_base64"  # Request base64 output
        ]

        # Execute the command
        start_time = time.time()
        logger.info(f"Executing command: {' '.join(command)}")

        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=True
            )
        except subprocess.CalledProcessError as e:
            error_msg = f"Command failed with return code {e.returncode}"
            logger.error(f"{error_msg}\nCommand output: {e.stdout}\nCommand error: {e.stderr}")
            raise HTTPException(status_code=500, detail=error_msg)

        if result.returncode != 0:
            error_msg = f"Command failed with return code {result.returncode}"
            logger.error(f"{error_msg}\nCommand output: {result.stdout}\nCommand error: {result.stderr}")
            raise HTTPException(status_code=500, detail=error_msg)

        generation_time = time.time() - start_time
        logger.info(f"Image generation process completed in {generation_time:.2f}s")

        # Log the full output for debugging
        logger.debug(f"Full command output:\n{result.stdout}")

        # Extract base64 from output
        base64_image = None
        for line in result.stdout.split('\n'):
            if line.startswith('BASE64:'):
                base64_image = line[7:]  # Remove 'BASE64:' prefix
                logger.info("Found base64 data in output")
                break

        if not base64_image:
            error_msg = "Base64 image data not found in output"
            logger.error(f"{error_msg}\nFull output:\n{result.stdout}")
            raise HTTPException(status_code=500, detail=error_msg)

        # Verify the base64 data is valid
        try:
            import base64
            # Try to decode the base64 string to verify it's valid
            decoded_data = base64.b64decode(base64_image)
            logger.info(f"Base64 data validation successful. Decoded size: {len(decoded_data)} bytes")
        except Exception as e:
            error_msg = f"Invalid base64 data: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        logger.info("Successfully extracted and validated base64 image data")
        logger.info("="*50)

        return {
            "success": True,
            "image_base64": base64_image,
            "generation_time": f"{generation_time:.2f}s",
            "image_size": f"{request.height}x{request.width}",
            "file_path": output_file
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        error_msg = f"Image generation error: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        logger.error("="*50)
        raise HTTPException(status_code=500, detail=error_msg)

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Llama server on port 1025")
    uvicorn.run(app, host="0.0.0.0", port=1025)
