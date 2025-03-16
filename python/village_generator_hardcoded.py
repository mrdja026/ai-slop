import random
import json
from datetime import datetime
Environment = {
    "harsh": "Harsh windy environment",
    "sunny": "Sunny and warm environment", 
    "rainy": "Rainy and cool environment",
    "snowy": "Snowy and cold environment",
    "desert": "Desert and hot enviroment",
    "jungle": "Jungle and humid enviroment",
    "swamp": "Swamp and wet enviroment",
    "mountain": "Mountain and cold enviroment",
}

village_names = [
    "Amber",
    "Breeze",
    "Cascade",
    "Dawn",
    "Ember",
    "Fable",
    "Gale",
    "Harmony",
    "Ivy",
    "Jade",
    "Kestrel",
    "Lark",
    "Meadow",
    "Nest",
    "Orion",
    "Pine",
    "Quartz",
    "Ridge",
    "Serengeti",
    "Terra",    
    "Utopia",
    "Vale",
    "Wisteria",
    "Xanadu",
    "Yggdrasil",
    "Zephyr",
    "Amber",
    "Breeze",
    "Cascade",
    "Dawn",
    "Ember",
    "Fable",
    "Gale",
    
]

instructions = [
    "Create a village name that is a combination of the following words: ",
    "Create chaotic village",
    "Create peaceful village",
    "Create rich village",
    "Create poor village",
    "Create small village",
    "Create large village",
    "Create village with a lot of trees",
    "Create village with a lot of water",
    "Create village with a lot of animals",
    "Create village with a lot of plants",
    "Create village with a lot of minerals",
    "Create village with a lot of gold",
    "Create village with a lot of silver",
    "Create village with a lot of diamonds",
]

vilage_output = [
    {   
        "instructions": random.choice(instructions),
        # "name": random.choice(village_names),
        # "environment": random.choice(list(Environment.values())),
        "output": random.choice(village_names) + " " + random.choice(list(Environment.values()))
    }
]


def generate_village_name():
    response = []
    for i in range(100):
        response.append({
            "instructions": random.choice(instructions),
            "input":"",
            "output": random.choice(village_names) + " " + random.choice(list(Environment.values()))
        })
    return response

def generate_village_data_json():
    data = generate_village_name()
    # print(data)
    try:
        with open("./village_data.json"+datetime.now().strftime("%Y-%m-%d_%H-%M-%S"), "w") as f:
             json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Error generating village data: {e}")


generate_village_data_json()
   



