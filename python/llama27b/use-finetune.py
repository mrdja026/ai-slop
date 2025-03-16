from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch
import logging
import os
import sys
from peft import PeftModel, PeftConfig
import time
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('inference.log'),
        logging.StreamHandler()
    ]
)

def setup_environment():
    """Setup CUDA and environment variables."""
    try:
        # Set PyTorch and CUDA memory settings
        os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:128,expandable_segments:True"
        os.environ["CUDA_VISIBLE_DEVICES"] = "0"
        
        if not torch.cuda.is_available():
            logging.warning("CUDA is not available. Using CPU (this will be slow)")
            return "cpu"
        
        # Log GPU info
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        logging.info(f"Using GPU: {gpu_name} with {gpu_memory:.2f} GB memory")
        return "cuda"
        
    except Exception as e:
        logging.error(f"Error setting up environment: {e}")
        raise

def load_model_and_tokenizer(model_dir):
    """Load the fine-tuned model and tokenizer with error handling."""
    try:
        logging.info(f"Loading model from {model_dir}")
        
        # Clear GPU cache
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Load base model and tokenizer
        base_model_name = "NousResearch/Llama-2-7b-chat-hf"  # Make sure this matches your training
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            base_model_name,
            trust_remote_code=True,
            use_fast=True
        )
        logging.info("Tokenizer loaded successfully")
        
        # Load the model with 4-bit quantization for efficiency
        model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            low_cpu_mem_usage=True
        )
        
        # Load LoRA adapter
        model = PeftModel.from_pretrained(
            model,
            model_dir,
            torch_dtype=torch.float16
        )
        
        logging.info("Model loaded successfully with 4-bit quantization and LoRA adapters")
        return model, tokenizer
        
    except Exception as e:
        logging.error(f"Error loading model: {e}")
        raise

def generate_text(generator, prompt, num_generations=1):
    """Generate text with multiple samples and error handling."""
    try:
        start_time = time.time()
        outputs = []
        
        for i in range(num_generations):
            output = generator(
                prompt,
                do_sample=True,
                temperature=0.85,  # Slightly reduced for more coherent output
                top_p=0.95,
                top_k=40,
                max_new_tokens=512,  # Use max_new_tokens instead of max_length
                num_return_sequences=1,
                repetition_penalty=1.15,
                pad_token_id=generator.tokenizer.eos_token_id,
                eos_token_id=generator.tokenizer.eos_token_id,
                return_full_text=False,  # Only return the generated text, not the prompt
                length_penalty=1.2,  # Increased to encourage more detailed responses
                no_repeat_ngram_size=4  # Increased to prevent larger phrase repetitions
            )
            outputs.append(output[0]['generated_text'])
        
        generation_time = time.time() - start_time
        logging.info(f"Text generation completed in {generation_time:.2f} seconds")
        return outputs
        
    except Exception as e:
        logging.error(f"Error during text generation: {e}")
        raise

def main():
    try:
        # Setup environment
        device = setup_environment()
        
        # Path to your fine-tuned model folder
        model_dir = "./village_finetuned_model"
        
        # Load model and tokenizer
        model, tokenizer = load_model_and_tokenizer(model_dir)
        
        # Create text generation pipeline
        generator = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            device_map="auto"
        )
        
        # Initialize results dictionary
        results = {
            "generation_timestamp": datetime.now().isoformat(),
            "model_name": "NousResearch/Llama-2-7b-chat-hf",
            "responses": []
        }
        
        # Example prompts with more detailed instructions
        prompts = [
            {
                "instruction": "Generate a detailed, imaginative description of a quaint medieval village. Include details about buildings, people, daily life, and the surrounding environment.",
                "input": "Village: Eldoria\nTime: Medieval period\nLocation: Valley surrounded by forests"
            },
            {
                "instruction": "Create a vivid description of a village in a desert environment. Describe the architecture, how people survive the harsh climate, and unique cultural aspects.",
                "input": "Village: Sandstone Haven\nClimate: Hot desert\nSpecial feature: Built around an oasis"
            },{
                "instruction": "Village in the desert",
                "input": "Village: Sandstone Haven"
            }
        ]
        
        # Generate text for each prompt
        for prompt_data in prompts:
            prompt = (
                f"### Instruction:\n{prompt_data['instruction']}\n"
                f"### Input:\n{prompt_data['input']}\n"
                f"### Response:\nLet me describe this village in detail:\n"
            )
            
            logging.info(f"\nGenerating text for prompt:\n{prompt}\n")
            
            # Generate multiple versions
            outputs = generate_text(generator, prompt, num_generations=2)
            
            # Store prompt and responses
            prompt_result = {
                "prompt": {
                    "instruction": prompt_data["instruction"],
                    "input": prompt_data["input"]
                },
                "generations": []
            }
            
            # Process and store each generation
            for i, output in enumerate(outputs, 1):
                response = output.split("### Response:")[-1].strip()
                response = response.replace("Let me describe this village in detail:", "").strip()
                
                prompt_result["generations"].append({
                    "generation_number": i,
                    "text": response
                })
                
                # Also print to console for immediate feedback
                print(f"\nGeneration {i}:")
                print(response)
                print("-" * 50)
            
            results["responses"].append(prompt_result)
        
        # Save results to JSON file
        with open("../responses_response.json"+time.strftime("%Y%m%d_%H%M%S"), "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        logging.info("Results saved to response.json")
        
    except KeyboardInterrupt:
        logging.info("Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        logging.error(f"Process failed: {e}")
        sys.exit(1)
    finally:
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

if __name__ == "__main__":
    main()
