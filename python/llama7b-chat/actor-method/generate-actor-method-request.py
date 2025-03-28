from typing import List, Optional
import logging
import sys
import torch
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import time
from datetime import datetime
import os
import random
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('llm_generation.log')
    ]
)

logger = logging.getLogger(__name__)

biome_prompts = {
    "volcanic": "Village built inside dormant lava tubes with obsidian agriculture",
    "arctic": "Settlement on glacial back of migrating ice worms",
    "aerial": "Cloud-condenser towers powering floating markets",
    "desert": "Oasis city with solar collectors and water recycling",
    "jungle": "City of pyramids with solar collectors and water recycling",
    "ocean": "City of pyramids with solar collectors and water recycling",
    "tropical": "City of pyramids with solar collectors and water recycling",
    "urban": "City of pyramids with solar collectors and water recycling",
    "subterranean": "City of pyramids with solar collectors and water recycling",

}
feature_prompts = [
    "Village where all architecture is alive and growing",
    "Settlement built around a machine that slows time",
    "Community that communicates through scent instead of speech",
    "City of pyramids with solar collectors and water recycling",
    "City with gates and merchant guilds",
]

culture_prompts = {
    "matriarchal": "Female-led society with moon-phase governance",
    "ancestor-worship": "Bodies preserved as interactive statues",
    "tech-rejecting": "Allergy to electromagnetic fields",
    "nomadic": "Nomadic society with seasonal migrations",
    "hierarchical": "Hierarchical society with a single leader",
    "egalitarian": "Egalitarian society with a council of elders",
    "utopian": "Utopian society with a single leader",
    "dystopian": "Dystopian society with a single leader",

}

style_library = [
    "In the verbose, metaphor-rich style of China Miéville",
    "As a cynical merchant's trade report",
    "Like a children's fable with dark undertones",
    "Academic anthropology paper from 2147",
    "Haiku-like brevity with vivid nature imagery"
]

def build_system_message(
    base_instruction: str,
    examples: Optional[List[str]] = None,
    constraints: Optional[List[str]] = None,
    style: Optional[str] = None
) -> str:
    """
    Constructs a system message with optional components
    """
    system_msg = base_instruction

    if examples:
        system_msg += "\n\nExamples:\n- " + "\n- ".join(examples)

    if constraints:
        system_msg += "\n\nConstraints:\n* " + "\n* ".join(constraints)

    if style:
        system_msg += f"\n\nStyle: {style}"

    return system_msg

def setup_environment():
    """Setup CUDA and environment variables."""
    try:
        os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:128,expandable_segments:True"
        if not torch.cuda.is_available():
            logger.warning("CUDA is not available. Using CPU (this will be slow)")
            return "cpu"
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        logger.info(f"Using GPU: {gpu_name} with {gpu_memory:.2f} GB memory")
        return "cuda"
    except Exception as e:
        logger.error(f"Error setting up environment: {e}")
        raise

def build_prompt(
    system_msg: str,
    user_prompt: str,
    style: Optional[str] = None,
    constraints: Optional[List[str]] = None
) -> str:
    """
    Builds a prompt in Llama 2 chat format matching the frontend structure.
    """
    # Split system_msg into components if it contains them
    components = system_msg.split('\n\n')

    # Initialize default values
    choice = ""
    biome = ""
    features = ""
    constriction = ""
    text_style = style if style else ""

    # Parse components if they exist
    for component in components:
        if component.startswith("Choice:"):
            choice = component.replace("Choice:", "").strip()
        elif component.startswith("Biome:"):
            biome = component.replace("Biome:", "").strip()
        elif component.startswith("Features:"):
            features = component.replace("Features:", "").strip()
        elif component.startswith("Constriction:"):
            constriction = component.replace("Constriction:", "").strip()
        elif component.startswith("Text Style:"):
            text_style = component.replace("Text Style:", "").strip()

    # Build the prompt in the exact format requested
    prompt = f"<s>[INST] <<SYS>>\nI assume role as DM generating content with the following settings:\n\n"
    prompt += f"Choice:\n- {choice}\n\n"
    prompt += f"Biome:\n- {biome}\n\n"
    prompt += f"Features:\n- {features}\n\n"
    prompt += f"Constriction:\n- {constriction}\n\n"
    prompt += f"Text Style:\n- {text_style}\n"
    prompt += f"<</SYS>>\n\n{user_prompt}\n\n"
    prompt += f"Style: {text_style} [/INST]"

    return prompt

def generate_response(
    system_msg: str,
    prompt: str,
    temperature: float = 0.85,
    max_tokens: int = 512,
    generator=None,
    tokenizer=None
) -> Optional[str]:
    """
    Generate a response using the Hugging Face transformers pipeline.
    Returns None if generation fails.
    """
    try:
        # Format the prompt using Llama 2 chat format
        formatted_prompt = build_prompt(
            system_msg=system_msg,
            user_prompt=prompt
            # Remove style and constraints parameters as they're already in system_msg
        )

        logger.info("Generating response")
        start_time = time.time()

        output = generator(
            formatted_prompt,
            do_sample=True,
            temperature=temperature,
            top_p=0.95,
            top_k=40,
            max_new_tokens=max_tokens,
            num_return_sequences=1,
            repetition_penalty=1.15,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            return_full_text=False,
            length_penalty=1.2,
            no_repeat_ngram_size=4
        )

        generation_time = time.time() - start_time
        logger.info(f"Response generated in {generation_time:.2f} seconds")

        response_text = output[0]['generated_text'].strip()
        return response_text

    except Exception as e:
        logger.error(f"Error during generation: {str(e)}")
        return None

def generate_random_system_message():
    """Generate a random combination of prompts."""
    biome = random.choice(list(biome_prompts.keys()))
    base_instruction = biome_prompts[biome]

    # Randomly select 1-2 feature prompts
    num_features = random.randint(1, 2)
    examples = random.sample(feature_prompts, num_features)

    # Randomly select 1-2 culture constraints
    num_cultures = random.randint(1, 2)
    culture_types = random.sample(list(culture_prompts.keys()), num_cultures)
    constraints = [culture_prompts[c] for c in culture_types]

    # Random style
    style = random.choice(style_library)

    return {
        "biome": biome,
        "features": examples,
        "cultures": culture_types,
        "style": style,
        "message": build_system_message(
            base_instruction=base_instruction,
            examples=examples,
            constraints=constraints,
            style=style
        )
    }

def generate_random_user_prompt():
    """Generate a random user prompt."""
    prompts = [
        "Give me a description of coludy village",
        "Describe the most unique architectural feature village of the dead",
        "How do people here make their living in this great town?",
        "What are the most important cultural traditions here?",
        "Describe a typical festival or celebration in this society",
        "Storm willage with faries"
        "How do they handle resource distribution and trade?",
        "What are their relationships with neighboring societies like?",
        "Describe their technological innovations",
        "What are their spiritual or religious practices?",
        "How do they educate their young?",
        "Village sand stone"
        "Village water sho"
    ]
    return random.choice(prompts)

def save_results_to_json(results: dict, is_final: bool = False) -> str:
    """
    Save results to a JSON file with timestamp in the filename.
    Returns the filename that was used.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    status = "final" if is_final else "intermediate"
    filename = f"response-agent_{timestamp}_{status}.json"

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    return filename

def test_prompt_generation():
    """Test function to demonstrate full prompt generation with all components."""
    print("\n1. Individual Components:")
    print("-" * 30)

    # Example data
    test_biome = "aerial"
    test_features = ["Village where all architecture is alive and growing",
                    "Settlement built around a machine that slows time"]
    test_cultures = ["matriarchal", "tech-rejecting"]
    test_style = "In the verbose, metaphor-rich style of China Miéville"
    test_user_prompt = "Tell me about this society"

    print(f"Biome: {test_biome}")
    print(f"Base Instruction: {biome_prompts[test_biome]}")
    print("\nFeatures:")
    for f in test_features:
        print(f"- {f}")
    print("\nCulture Constraints:")
    for c in test_cultures:
        print(f"- {culture_prompts[c]}")
    print(f"\nStyle: {test_style}")
    print(f"\nUser Prompt: {test_user_prompt}")

    # Build system message
    print("\n2. System Message:")
    print("-" * 30)
    system_message = build_system_message(
        base_instruction=biome_prompts[test_biome],
        examples=test_features,
        constraints=[culture_prompts[c] for c in test_cultures],
        style=test_style
    )
    print(system_message)

    # Build final prompt
    print("\n3. Final Llama 2 Chat Format:")
    print("-" * 30)
    final_prompt = build_prompt(
        system_msg=system_message,
        user_prompt=test_user_prompt
    )
    print(final_prompt)

if __name__ == "__main__":
    # Add test before main execution
    print("\nTesting Prompt Generation:")
    print("=" * 50)
    test_prompt_generation()
    print("=" * 50)
    print("\nStarting Main Generation:")

    start_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_attempts": 10,
        "successful_generations": 0,
        "failed_generations": 0,
        "generations": []
    }

    num_generations = 10
    logger.info(f"Attempting {num_generations} different scenarios")

    try:
        # Initialize model and tokenizer once, outside the loop
        logger.info("Setting up environment")
        device = setup_environment()

        logger.info("Loading model and tokenizer")
        model_name = "NousResearch/Llama-2-7b-chat-hf"

        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            trust_remote_code=True,
            use_fast=True
        )

        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            low_cpu_mem_usage=True
        )

        generator = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            device_map="auto"
        )

        for i in range(num_generations):
            generation_start_time = time.time()
            logger.info(f"Generating scenario {i+1}/{num_generations}")

            try:
                # Generate random system message
                system_data = generate_random_system_message()
                user_prompt = generate_random_user_prompt()

                # Generate response using the new format
                response_text = generate_response(
                    system_msg=system_data["message"],
                    prompt=user_prompt,
                    generator=generator,
                    tokenizer=tokenizer
                )

                generation_time = time.time() - generation_start_time

                # Store results
                generation_result = {
                    "system_data": {
                        "biome": system_data["biome"],
                        "features": system_data["features"],
                        "cultures": system_data["cultures"],
                        "style": system_data["style"],
                        "full_message": system_data["message"]
                    },
                    "user_prompt": user_prompt,
                    "formatted_prompt": build_prompt(
                        system_msg=system_data["message"],
                        user_prompt=user_prompt
                    ),
                    "response": response_text if response_text else "Generation failed",
                    "generation_number": i + 1,
                    "generation_time": f"{generation_time:.2f}s",
                    "success": bool(response_text)
                }

                results["generations"].append(generation_result)

                if response_text:
                    results["successful_generations"] += 1
                    status = "Success"
                else:
                    results["failed_generations"] += 1
                    status = "Failed"

                print(f"\nScenario {i+1} completed ({status})")
                print("-" * 50)
                print(f"Biome: {system_data['biome']}")
                print(f"Style: {system_data['style']}")
                print(f"Prompt: {user_prompt}")
                print(f"Time taken: {generation_time:.2f}s")

                # Save intermediate results after each generation
                filename = save_results_to_json(results)
                logger.info(f"Saved intermediate results to {filename}")

                # Small delay between generations
                if i < num_generations - 1:
                    time.sleep(2)

            except Exception as e:
                logger.error(f"Error in generation {i+1}: {str(e)}")
                results["failed_generations"] += 1
                generation_result = {
                    "generation_number": i + 1,
                    "error": str(e),
                    "success": False
                }
                results["generations"].append(generation_result)
                continue

    except Exception as e:
        logger.error(f"Fatal error in main process: {str(e)}")
    finally:
        # Final save of results with timestamp
        final_filename = save_results_to_json(results, is_final=True)

        # Cleanup
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info(f"Process completed. Successful generations: {results['successful_generations']}")
        logger.info(f"Failed generations: {results['failed_generations']}")
        logger.info(f"Final results saved to {final_filename}")
