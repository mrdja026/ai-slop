# Testing Lallama 7B Models for general GEN AI

## General info
  - Coding on WSL2 and setting up limits the hardware since sharing of resources is hard
  - 7b llama chat models provide decent results q 4
  - Tokenisation must be looked upon since it sometimes excededs the window
  - Proper data extraction
  - To get more productive results to analyze data must not be hardcoded
	- Ways of prompting must be tested
		- Instruction VS Chat normal
  - Proper sys message must be used
      - Assume a role of "DM" "Player"
      - Build a Town "Willage"
      - Optional constraints
      - Optional style
      - Etc


# TODO
 - Understand slop
 - Deprecation warnings
 - linters
 - TYPOS
 - short prompts [village,weather,3 words max]
       - Data to be reasonable
              - Some sort of gramapthics what is allowed in what combination for fine tuning or Instruction prompting, neki automat
 - API
 - Client
 - Maintainece of requqiments.txt
 - check meta access of lama models for chat

file structure and how to install
ssh auto start in vm -.-

## Two point aproach

 - [X] Master prompt template without fine tuning
        - Instruction Prompting: Explicitly separating system instructions, user input, and constraints.
        - Llama-2 Chat Format: Uses [INST] and <<SYS>> tags to denote conversational roles (ref).
 - [X] Fine tuning with with limited data tests
        - Random data can be seen
        - Worked 1 h on 7B params quant 4
        - Terminal outputs:
         ![Terminal Output 1](assets/WindowsTerminal_UGAFiQrieg.png)
         ![Terminal Output 2](assets/WindowsTerminal_4UI7gIJgQx.png)

- [x] Basic image generation
       - Stable fusion implementation
              - [x] need more resources
       - Example outputs:
         ![Generated Landscape](assets/response-agent_20250316_141258_intermediate_response_2_20250316_151036.png)
         ![Generated Landscape](assets/response-agent_20250316_141418_final_response_9_20250316_152549.png)
         ![Generated Landscape](assets/response-agent_20250316_141418_final_response_9_20250316_154721.png)




## Compare perfs, quants and check lower models


## Local setup

- 64 GB ram 6 ghz
- 16 GB VRAM - cuda available
- WSL 2
- Ollama
- Hugging face
- python
    - for llm communication
    - data generation
    - data extraction TBD
- TODO :/ create requqiments.txt
- TBD://Copy paste instructions that work
