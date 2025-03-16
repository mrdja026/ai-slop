from huggingface_hub import snapshot_download

# This will download the model to a local cache directory and return the path
local_dir = snapshot_download("NousResearch/Llama-2-7b-chat-hf")
print(f"Model downloaded to: {local_dir}")
