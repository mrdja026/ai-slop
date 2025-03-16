from datasets import load_dataset
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    TrainingArguments, 
    Trainer, 
    DataCollatorForLanguageModeling,
    TrainerCallback,
    TrainerState
)
import torch
import logging
import os
import sys

# Set PyTorch and CUDA memory settings
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:128,expandable_segments:True"
os.environ["CUDA_VISIBLE_DEVICES"] = "0"

# Configure logging
try:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('finetune.log'),
            logging.StreamHandler()
        ]
    )
except Exception as e:
    print(f"Failed to configure logging: {e}")
    raise

def load_dataset_safely():
    try:
        dataset = load_dataset("json", data_files={"train": "../village_data.json"}, split="train")
        if len(dataset) == 0:
            raise ValueError("Dataset is empty")
        logging.info(f"Dataset loaded with {len(dataset)} examples")
        return dataset
    except FileNotFoundError:
        logging.error("village_data.json file not found")
        raise
    except Exception as e:
        logging.error(f"Failed to load dataset: {str(e)}")
        raise

def initialize_model_and_tokenizer(model_name):
    try:
        # Clear GPU cache before loading model
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.reset_peak_memory_stats()
        
        tokenizer = AutoTokenizer.from_pretrained(
            model_name, 
            trust_remote_code=True,
            use_fast=True
        )
        logging.info("Tokenizer loaded successfully")
        
        # Check if CUDA is available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logging.info(f"Using device: {device}")
        
        # Get GPU memory info
        if torch.cuda.is_available():
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logging.info(f"Total GPU memory: {gpu_memory:.2f} GB")
            
            # Set very conservative GPU memory limit
            max_memory = {0: "8GB"}  # Reduced to 8GB
            logging.info(f"Setting GPU memory limit to: {max_memory[0]}")
        
        # Load model with 8-bit quantization
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,  # Changed to float16 for better compatibility
            device_map={"": 0},
            max_memory=max_memory,
            load_in_8bit=True,  # Use 8-bit quantization instead
            low_cpu_mem_usage=True
        )
        
        # Enable memory optimizations
        model.gradient_checkpointing_enable()
        model.config.use_cache = False
        logging.info("Model loaded successfully with 8-bit quantization and memory optimizations")
        
        return tokenizer, model
    except OSError as e:
        logging.error(f"Failed to download or load model/tokenizer: {e}")
        raise
    except torch.cuda.OutOfMemoryError:
        logging.error("GPU out of memory while loading model")
        raise
    except Exception as e:
        logging.error(f"Unexpected error loading model/tokenizer: {e}")
        raise

def tokenize_function(example, tokenizer):
    try:
        if not isinstance(example['instructions'], str):
            logging.error(f"Invalid data type - instructions: {type(example['instructions'])}")
            raise ValueError("Instructions is not a string")
            
        # Simplified prompt format
        full_text = f"### Instruction: {example['instructions']}\n### Response: {example.get('output', '')}"
        
        tokens = tokenizer(
            full_text,
            truncation=True,
            max_length=32,  # Reduced from 64
            padding=False,
            return_tensors=None
        )
        
        if not tokens or len(tokens['input_ids']) == 0:
            raise ValueError("Tokenization produced empty output")
            
        return tokens
    except Exception as e:
        logging.error(f"Tokenization error for example: {str(e)}")
        raise

def main():
    try:
        # Load dataset
        dataset = load_dataset_safely()
        
        # Print dataset info
        logging.info(f"Dataset features: {dataset.features}")
        logging.info(f"Dataset size: {len(dataset)}")
        logging.info("First example:")
        logging.info(dataset[0])
        
        # Initialize model and tokenizer
        model_name = "NousResearch/Llama-2-7b-chat-hf"
        tokenizer, model = initialize_model_and_tokenizer(model_name)
        
        # Tokenize dataset
        logging.info("Starting dataset tokenization...")
        tokenized_dataset = dataset.map(
            lambda x: tokenize_function(x, tokenizer),
            batched=False,  # Process one example at a time
            remove_columns=dataset.column_names,
            desc="Tokenizing dataset"
        )
        
        # Setup training
        output_dir = "./village_finetuned_model"
        os.makedirs(output_dir, exist_ok=True)
        
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=1,
            gradient_accumulation_steps=128,
            learning_rate=2e-4,
            logging_steps=10,
            save_steps=50,
            fp16=True,  # Changed to fp16 to match model dtype
            gradient_checkpointing=True,
            optim="adamw_torch",
            max_grad_norm=0.3,
            warmup_ratio=0.03,
            weight_decay=0.01,
            report_to="tensorboard",
            dataloader_pin_memory=False,
            save_total_limit=1,
            ddp_find_unused_parameters=False,
            no_cuda=False,
            max_steps=50,
            dataloader_num_workers=0,
            group_by_length=True,
            length_column_name="length"
        )
        
        # Initialize trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
            data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)
        )
        
        # Train
        logging.info("Starting training...")
        trainer.train()
        
        # Save results
        logging.info("Saving model and tokenizer...")
        trainer.save_model(output_dir)
        tokenizer.save_pretrained(output_dir)
        logging.info("Training completed successfully")
        
    except KeyboardInterrupt:
        logging.warning("Training was interrupted by user")
        # Optionally save checkpoint here
        raise
    except torch.cuda.OutOfMemoryError:
        logging.error("GPU out of memory during training")
        raise
    except Exception as e:
        logging.error(f"Training failed: {str(e)}")
        raise
    finally:
        # Cleanup if needed
        torch.cuda.empty_cache()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logging.info("Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        logging.error(f"Process failed: {e}")
        sys.exit(1)