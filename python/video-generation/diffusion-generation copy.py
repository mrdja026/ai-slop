import torch
import logging
import imageio
import os
from diffusers import StableVideoDiffusionPipeline
from diffusers.utils import export_to_video
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Memory optimization settings
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True

def generate_video(
    prompt: str,
    output_path: str = "generated_video.mp4",
    height: int = 512,  # Start with 512 but will auto-reduce if needed
    width: int = 512,
    num_frames: int = 25,
    num_retries: int = 3
):
    # Initialize pipeline with memory optimizations
    try:
        pipe = StableVideoDiffusionPipeline.from_pretrained(
            "stabilityai/stable-video-diffusion-img2vid-xt",
            torch_dtype=torch.float16,
            variant="fp16",
            use_safetensors=True
        ).to("cuda")

        # Apply memory optimizations
        pipe.enable_model_cpu_offload()
        pipe.enable_vae_slicing()
        pipe.enable_vae_tiling()
        pipe.unet.enable_forward_chunking(chunk_size=1)
        pipe.enable_attention_slicing(slice_size=4)

        # Generate initial image
        logger.info("Creating initial image...")
        input_image = Image.new("RGB", (256, 256), (0, 0, 0))  # Temporary black image

        # Generation parameters
        params = {
            "image": input_image,
            "height": height,
            "width": width,
            "num_frames": num_frames,
            "num_inference_steps": 25,
            "motion_bucket_id": 100,
            "noise_aug_strength": 0.1,
            "generator": torch.Generator("cuda").manual_seed(42)
        }

        # Attempt generation with auto-fallback
        for attempt in range(num_retries):
            try:
                logger.info(f"Generation attempt {attempt + 1}/{num_retries}")
                frames = pipe(**params).frames[0]
                break
            except torch.cuda.OutOfMemoryError:
                logger.warning("Out of memory, reducing parameters...")
                params["height"] = max(params["height"] // 2, 256)
                params["width"] = max(params["width"] // 2, 256)
                params["num_frames"] = max(params["num_frames"] // 2, 15)
                params["num_inference_steps"] = max(params["num_inference_steps"] - 5, 15)
                torch.cuda.empty_cache()

        # Export video
        export_to_video(frames, output_path, fps=7)
        logger.info(f"Video saved to: {output_path}")
        return True

    except Exception as e:
        logger.error(f"Video generation failed: {str(e)}")
        return False
    finally:
        # Cleanup
        if 'pipe' in locals():
            del pipe
        torch.cuda.empty_cache()
        gc.collect()

if __name__ == "__main__":
    generate_video(
        prompt="A peaceful village with smoke coming from chimneys",
        output_path="village_video.mp4",
        height=384,  # Start with 384x384 for safety
        width=384,
        num_frames=20
    )
