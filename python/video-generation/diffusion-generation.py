import torch
import logging
import imageio
import os
import gc  # Add gc import
import time  # Add time import for duration tracking
from diffusers import StableVideoDiffusionPipeline, DiffusionPipeline
from diffusers.utils import export_to_video
from PIL import Image

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Memory optimization settings
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True

def log_gpu_memory(step: str = ""):
    """Log GPU memory usage at a given step"""
    if torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated() / 1024**3
        reserved = torch.cuda.memory_reserved() / 1024**3
        max_allocated = torch.cuda.max_memory_allocated() / 1024**3
        free_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3 - allocated
        logger.info(f"GPU Memory [{step}] - "
                   f"Allocated: {allocated:.2f}GB, "
                   f"Reserved: {reserved:.2f}GB, "
                   f"Max Allocated: {max_allocated:.2f}GB, "
                   f"Free: {free_memory:.2f}GB")

def clear_gpu_memory():
    """Clear GPU memory and log the amount freed"""
    if torch.cuda.is_available():
        before = torch.cuda.memory_allocated() / 1024**3
        torch.cuda.empty_cache()
        gc.collect()  # Add explicit garbage collection
        after = torch.cuda.memory_allocated() / 1024**3
        freed = before - after
        logger.info(f"Memory cleaned up: {freed:.2f}GB freed")
        logger.info(f"Current free memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3 - after:.2f}GB")

def generate_video(
    prompt: str,
    output_path: str = "generated_video.mp4",
    height: int = 256,  # Reduced to 256 for memory efficiency
    width: int = 256,   # Reduced to 256 for memory efficiency
    num_frames: int = 48,  # 2 seconds at 24 FPS
    num_retries: int = 3
):
    """Generate video from text prompt with comprehensive logging and error handling"""
    try:
        start_time = time.time()
        logger.info(f"Starting video generation for prompt: '{prompt}'")
        logger.info(f"Initial parameters - Height: {height}, Width: {width}, Frames: {num_frames} (2 seconds at 24 FPS)")
        log_gpu_memory("startup")

        # First create a text-to-image pipeline for the initial image
        logger.info("Initializing text-to-image pipeline...")
        img_pipe = DiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",  # Using SD 1.5 for better reliability
            torch_dtype=torch.float16,
            use_safetensors=True,
            safety_checker=None
        ).to("cuda")

        # Generate initial image
        logger.info("Generating initial image from prompt...")
        with torch.inference_mode():
            with torch.cuda.amp.autocast(enabled=True):
                initial_image = img_pipe(
                    prompt=prompt + ", high quality, detailed",  # Simplified quality prompt
                    negative_prompt="blurry, low quality, distorted",
                    num_inference_steps=30,  # Reduced steps for memory
                    guidance_scale=7.5,      # Slightly reduced guidance
                    height=height,
                    width=width
                ).images[0]

        logger.info("Initial image generated successfully")

        # Save initial image for reference
        initial_image_path = os.path.splitext(output_path)[0] + "_initial.png"
        initial_image.save(initial_image_path)
        logger.info(f"Initial image saved to: {initial_image_path}")

        # Clear memory after image generation
        del img_pipe
        clear_gpu_memory()
        log_gpu_memory("after initial image generation")

        # Initialize video pipeline
        logger.info("Initializing StableVideoDiffusionPipeline...")
        pipe = StableVideoDiffusionPipeline.from_pretrained(
            "stabilityai/stable-video-diffusion-img2vid-xt",
            torch_dtype=torch.float16,
            use_safetensors=True
        )

        # Move to CUDA after initialization
        pipe = pipe.to("cuda")
        log_gpu_memory("after pipeline load")

        # Apply memory optimizations
        logger.info("Applying memory optimizations...")
        pipe.enable_model_cpu_offload()
        pipe.enable_attention_slicing(slice_size="max")

        # Clear memory after optimizations
        clear_gpu_memory()
        log_gpu_memory("after optimizations")

        # Generation parameters with reduced memory usage
        params = {
            "image": initial_image,
            "height": height,
            "width": width,
            "num_frames": num_frames,
            "num_inference_steps": 25,      # Reduced steps
            "motion_bucket_id": 150,        # Moderate motion
            "noise_aug_strength": 0.1       # Reduced noise
        }

        # Attempt generation with auto-fallback
        for attempt in range(num_retries):
            try:
                logger.info(f"Generation attempt {attempt + 1}/{num_retries}")
                logger.info(f"Current parameters - Height: {params['height']}, "
                          f"Width: {params['width']}, "
                          f"Frames: {params['num_frames']}, "
                          f"Steps: {params['num_inference_steps']}")
                log_gpu_memory(f"before attempt {attempt + 1}")

                with torch.inference_mode():
                    with torch.cuda.amp.autocast(enabled=True):
                        frames = pipe(**params).frames[0]
                logger.info(f"Successfully generated frames on attempt {attempt + 1}")
                log_gpu_memory(f"after attempt {attempt + 1}")
                break

            except torch.cuda.OutOfMemoryError as e:
                logger.warning(f"Out of memory on attempt {attempt + 1}: {str(e)}")
                if attempt < num_retries - 1:
                    logger.info("Reducing parameters for next attempt...")
                    params["height"] = max(params["height"] // 2, 128)
                    params["width"] = max(params["width"] // 2, 128)
                    params["num_frames"] = max(params["num_frames"] // 2, 15)
                    params["num_inference_steps"] = max(params["num_inference_steps"] - 5, 15)
                    clear_gpu_memory()
                else:
                    raise

        # Export video with 24 FPS
        logger.info("Exporting video...")
        export_to_video(frames, output_path, fps=24)
        duration = time.time() - start_time
        logger.info(f"Video generation completed in {duration:.2f} seconds")
        logger.info(f"Video saved to: {output_path} (2 seconds at 24 FPS)")
        log_gpu_memory("final")
        return True

    except Exception as e:
        logger.error(f"Error during pipeline execution: {str(e)}")
        raise

    finally:
        # Cleanup
        logger.info("Performing final cleanup...")
        if 'pipe' in locals():
            del pipe
        clear_gpu_memory()

if __name__ == "__main__":
    generate_video(
        prompt="Top down view of a village with a river",  # Detailed prompt
        output_path="village_video."+time.strftime("%Y%m%d_%H%M%S") + ".mp4",
        height=256,  # Reduced resolution
        width=256,   # Reduced resolution
        num_frames=24,  # 2 seconds at 24 FPS
        num_retries=3
    )
