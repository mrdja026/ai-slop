import logging
import sys
import os
from datetime import datetime
import torch
import subprocess
import gc
import json
import argparse
import base64
from io import BytesIO
from pathlib import Path
from diffusers import StableDiffusionPipeline

# Set PyTorch memory allocation configuration for WSL2
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:512"
torch.cuda.set_per_process_memory_fraction(0.95)  # Use 95% of available GPU memory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('image_generation.log')
    ]
)
logger = logging.getLogger(__name__)

def check_dependencies():
    """Check and install required dependencies."""
    try:
        logger.info("Installing PyTorch...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--no-cache-dir", "torch", "torchvision", "torchaudio", "--index-url", "https://download.pytorch.org/whl/cu118"])

        logger.info("Installing other dependencies...")
        required_packages = [
            "diffusers[torch]>=0.21.0",
            "transformers>=4.25.1",
            "accelerate>=0.21.0",
            "safetensors>=0.3.1"
        ]

        for package in required_packages:
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--no-cache-dir", package])
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to install {package}: {str(e)}")
                raise

        # Verify imports
        import diffusers
        import transformers
        import accelerate
        logger.info("All dependencies installed successfully")
        return True

    except Exception as e:
        logger.error(f"Error checking/installing dependencies: {str(e)}")
        raise

def clear_gpu_memory():
    """Clear GPU memory and run garbage collection."""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()
    gc.collect()
    logger.info("GPU memory cleared")

def setup_pipeline(model_id: str):
    """Setup the pipeline with optimizations for WSL2 environment."""
    import torch
    from diffusers import StableDiffusionPipeline

    logger.info("Setting up pipeline...")
    try:
        # Check CUDA availability
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA is not available")

        # Clear GPU memory before loading model
        clear_gpu_memory()

        # Get available VRAM and set limit before model loading
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        logger.info(f"Available GPU memory: {gpu_memory:.2f} GB")
        logger.info("Using WSL2 environment - optimizing for GPU-only processing")

        # WSL2 optimized settings
        torch.backends.cudnn.benchmark = False  # Disable for stability
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True

        # Load smaller model with optimizations
        pipe = StableDiffusionPipeline.from_pretrained(
            "CompVis/stable-diffusion-v1-4",  # Smaller model than SDXL
            torch_dtype=torch.float16,
            revision="fp16",
            safety_checker=None,
            requires_safety_checker=False
        ).to("cuda")

        # Memory optimizations
        pipe.enable_attention_slicing(slice_size="auto")
        pipe.enable_vae_tiling()

        logger.info("Pipeline setup completed successfully")
        return pipe

    except Exception as e:
        logger.error(f"Error setting up pipeline: {str(e)}")
        raise

def generate_image(
    pipe,
    prompt: str,
    negative_prompt: str,
    output_file: str,
    num_steps: int = 30,
    guidance_scale: float = 7.5,
    size: tuple = (768, 512),
    return_base64: bool = False
):
    """Generate image with error handling and progress logging."""
    try:
        logger.info("Starting image generation...")
        logger.info(f"Prompt: {prompt}")
        logger.info(f"Settings: {num_steps} steps, {guidance_scale} guidance scale, {size} resolution")
        logger.info(f"Output file: {output_file}")

        # Generate image with optimized settings
        with torch.inference_mode():
            result = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=num_steps,
                guidance_scale=guidance_scale,
                height=size[0],
                width=size[1]
            )

            if not result.images:
                raise RuntimeError("No image was generated")

            image = result.images[0]

        # Create output directory if it doesn't exist
        output_dir = os.path.dirname(output_file)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        # Save the image to file
        image.save(output_file)
        logger.info(f"Image saved successfully to {output_file}")

        # If base64 is requested, convert the image to base64
        if return_base64:
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            logger.info("Image converted to base64")
            return output_file, img_base64

        return output_file, None

    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        raise

def load_response_data(json_file: str):
    """Load and parse response data from JSON file."""
    try:
        with open(json_file, 'r') as f:
            data = json.load(f)
        return data
    except Exception as e:
        logger.error(f"Error loading response data: {str(e)}")
        raise

def count_tokens(text: str) -> int:
    """Roughly estimate token count - this is a simple approximation."""
    # Split on spaces and punctuation
    words = text.replace('.', ' . ').replace(',', ' , ').replace('!', ' ! ').replace('?', ' ? ').split()
    # Count each word/punctuation as a token
    return len(words)

def create_prompt_from_response(response: str) -> str:
    """Create a focused prompt directly from the response text."""
    # Standard suffix we'll always add
    suffix = " Create a beautiful, top down view of a of a willage. Trending on ArtStation, highly detailed, sharp focus,cartoon style"
    suffix_tokens = count_tokens(suffix)

    # Take sentences until we hit the token limit
    sentences = response.split('.')
    current_text = ""
    total_tokens = 0

    for sentence in sentences:
        if not sentence.strip():
            continue

        # Check if adding this sentence would exceed the limit
        test_text = current_text + sentence + "." if current_text else sentence + "."
        test_tokens = count_tokens(test_text) + suffix_tokens

        if test_tokens > 70:  # Using 70 as a safety margin
            break

        current_text = test_text

    # If we couldn't get any sentences under the limit, take just the first one
    # and truncate it to fit
    if not current_text:
        first_sentence = sentences[0] + "."
        words = first_sentence.split()
        current_text = " ".join(words[:50])  # Arbitrary limit that should fit

    # Create the final prompt
    prompt = f"{current_text.strip()}"
    prompt += suffix

    return prompt

def batch_generate_images(response_dir: str, output_dir: str = "outputs/generated_images"):
    """Generate images for all JSON files in the response directory."""
    try:
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)

        # Setup pipeline once for all generations
        pipe = setup_pipeline("CompVis/stable-diffusion-v1-4")  # Using smaller model

        # Get all JSON files in the directory
        json_files = sorted([f for f in os.listdir(response_dir) if f.endswith('.json')])
        total_files = len(json_files)
        logger.info(f"Found {total_files} JSON files to process")

        for file_idx, json_file in enumerate(json_files, 1):
            try:
                logger.info(f"\n{'='*50}")
                logger.info(f"Processing file {file_idx}/{total_files}: {json_file}")
                logger.info(f"{'='*50}")

                # Load JSON data
                file_path = os.path.join(response_dir, json_file)
                data = load_response_data(file_path)

                responses = []

                # Extract responses based on file structure
                if isinstance(data, dict):
                    if "response" in data:
                        responses.append(data["response"])
                        logger.info("Found single response format")
                    elif "generations" in data:
                        for gen in data["generations"]:
                            if isinstance(gen, dict) and "response" in gen:
                                responses.append(gen["response"])
                        logger.info(f"Found multiple responses format: {len(responses)} responses")

                if not responses:
                    logger.warning(f"No responses found in {json_file}")
                    continue

                # Generate image for each response
                total_responses = len(responses)
                for idx, response in enumerate(responses, 1):
                    if not response or not response.strip():
                        logger.warning(f"Skipping empty response {idx}/{total_responses}")
                        continue

                    logger.info(f"\nProcessing response {idx}/{total_responses} from {json_file}")

                    prompt = create_prompt_from_response(response)
                    token_count = count_tokens(prompt)
                    logger.info(f"Generated prompt ({token_count} tokens): {prompt[:100]}...")

                    base_name = os.path.splitext(json_file)[0]
                    if len(responses) > 1:
                        output_file = os.path.join(output_dir, f"{base_name}_response_{idx}.png")
                    else:
                        output_file = os.path.join(output_dir, f"{base_name}.png")

                    logger.info(f"Generating image: {output_file}")

                    negative_prompt = "blurry, low quality, distorted, deformed, disfigured, bad anatomy, ugly, duplicate, error"

                    generate_image(
                        pipe=pipe,
                        prompt=prompt,
                        negative_prompt=negative_prompt,
                        output_file=output_file,
                        num_steps=30,  # Reduced steps
                        guidance_scale=7.5,  # Standard guidance
                        size=(768, 512),  # Smaller size
                        return_base64=False
                    )

                    logger.info(f"Completed response {idx}/{total_responses} from {json_file}")

                    # Clear memory between generations
                    torch.cuda.empty_cache()
                    gc.collect()

                logger.info(f"Completed processing file {file_idx}/{total_files}: {json_file}\n")

            except Exception as e:
                logger.error(f"Error processing file {json_file}: {str(e)}")
                continue

    except Exception as e:
        logger.error(f"Error in batch generation: {str(e)}")
        raise
    finally:
        clear_gpu_memory()

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Generate images using Stable Diffusion")
    parser.add_argument("--single_image", action="store_true", help="Generate a single image")
    parser.add_argument("--prompt", type=str, help="Text prompt for image generation")
    parser.add_argument("--negative_prompt", type=str, default="blurry, low quality, distorted, deformed, disfigured, bad anatomy, ugly, duplicate, error",
                      help="Negative prompt for image generation")
    parser.add_argument("--num_steps", type=int, default=30, help="Number of inference steps")
    parser.add_argument("--guidance_scale", type=float, default=7.5, help="Guidance scale")
    parser.add_argument("--height", type=int, default=768, help="Image height")
    parser.add_argument("--width", type=int, default=512, help="Image width")
    parser.add_argument("--output_file", type=str, help="Output file path")
    parser.add_argument("--return_base64", action="store_true", help="Return base64 encoded image")
    return parser.parse_args()

if __name__ == "__main__":
    try:
        args = parse_args()

        # Check dependencies
        check_dependencies()

        if args.single_image:
            if not args.prompt:
                logger.error("Prompt is required for single image generation")
                sys.exit(1)

            # Setup pipeline
            pipe = setup_pipeline("CompVis/stable-diffusion-v1-4")

            try:
                # Generate the image
                output_path, base64_image = generate_image(
                    pipe=pipe,
                    prompt=args.prompt,
                    negative_prompt=args.negative_prompt,
                    output_file=args.output_file,
                    num_steps=args.num_steps,
                    guidance_scale=args.guidance_scale,
                    size=(args.height, args.width),
                    return_base64=args.return_base64
                )
                print(f"Image generated successfully: {output_path}")
                if base64_image:
                    print(f"BASE64:{base64_image}")
            finally:
                clear_gpu_memory()
        else:
            # Original batch generation code
            response_dir = "../llama7b-chat/actor-method/response_data"
            output_dir = "outputs/generated_images"
            batch_generate_images(response_dir, output_dir)
            print(f"\nImage generation completed successfully!")
            print(f"Output directory: {output_dir}")

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)
    finally:
        # Final cleanup
        clear_gpu_memory()
