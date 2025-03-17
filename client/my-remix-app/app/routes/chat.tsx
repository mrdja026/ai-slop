import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import Chat from "~/components/Chat";

interface Message {
    id: string;
    text: string;
    sender: "user" | "assistant";
    timestamp: Date;
}

interface DropdownOption {
    value: string;
    label: string;
    description: string;
}

const CHOICE_OPTIONS: DropdownOption[] = [
    { value: "NPC", label: "NPC", description: "Generate a detailed non-player character" },
    { value: "Village", label: "Village", description: "Create a small settlement with its inhabitants" },
    { value: "Town", label: "Town", description: "Design a larger settlement with various districts" },
    { value: "Lore", label: "Lore", description: "Generate world-building lore and history" },
    { value: "Quest", label: "Quest", description: "Create an adventure quest with objectives" },
    { value: "Dungeon", label: "Dungeon", description: "Design a dungeon layout with encounters" },
    { value: "Shop", label: "Shop", description: "Generate a merchant establishment" },
    { value: "Tavern", label: "Tavern", description: "Create a social gathering place" },
];

const CONSTRICTION_OPTIONS: DropdownOption[] = [
    { value: "No Wind", label: "No Wind", description: "Environment without wind effects" },
    { value: "No Sand", label: "No Sand", description: "Location without sand or desert elements" },
    { value: "No People", label: "No People", description: "Area devoid of humanoid presence" },
    { value: "No Water", label: "No Water", description: "Setting without water sources" },
    { value: "No Magic", label: "No Magic", description: "Non-magical environment" },
    { value: "No Light", label: "No Light", description: "Dark or dimly lit area" },
    { value: "No Sound", label: "No Sound", description: "Silent or soundless environment" },
];

const BIOME_OPTIONS: DropdownOption[] = [
    { value: "Forest", label: "Forest", description: "Wooded area with various trees" },
    { value: "Desert", label: "Desert", description: "Arid, sandy environment" },
    { value: "Mountain", label: "Mountain", description: "Rocky, elevated terrain" },
    { value: "Swamp", label: "Swamp", description: "Wet, marshy area" },
    { value: "Tundra", label: "Tundra", description: "Cold, frozen landscape" },
    { value: "Jungle", label: "Jungle", description: "Dense, tropical vegetation" },
    { value: "Plains", label: "Plains", description: "Open, grassy area" },
];

const TEXT_STYLE_OPTIONS: DropdownOption[] = [
    { value: "Descriptive", label: "Descriptive", description: "Detailed, vivid descriptions" },
    { value: "Concise", label: "Concise", description: "Brief, to-the-point writing" },
    { value: "Poetic", label: "Poetic", description: "Flowery, lyrical language" },
    { value: "Technical", label: "Technical", description: "Precise, mechanical details" },
    { value: "Mysterious", label: "Mysterious", description: "Enigmatic, cryptic tone" },
    { value: "Humorous", label: "Humorous", description: "Light-hearted, funny style" },
];

const FEATURES_OPTIONS: DropdownOption[] = [
    { value: "Ancient", label: "Ancient", description: "Historical or aged elements" },
    { value: "Magical", label: "Magical", description: "Supernatural or enchanted aspects" },
    { value: "Dangerous", label: "Dangerous", description: "Hazardous or threatening elements" },
    { value: "Peaceful", label: "Peaceful", description: "Calm, tranquil atmosphere" },
    { value: "Secret", label: "Secret", description: "Hidden or concealed elements" },
    { value: "Sacred", label: "Sacred", description: "Religious or holy aspects" },
];

export const meta = () => {
    return [
        { title: "D&D AI Dungeon Master" },
        { name: "description", content: "Your AI-powered Dungeon Master for creating immersive fantasy worlds and adventures" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs) {
    // You can load initial data here if needed
    return json({});
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const message = formData.get("message");
    const choice = formData.get("choice");
    const biome = formData.get("biome");
    const features = formData.get("features");
    const constriction = formData.get("constriction");
    const textStyle = formData.get("textStyle");

    // Here you would make your API call to the AI service
    // For now, we'll return a mock response
    const systemMessage = `<s>[INST] <<SYS>>\nI assume role as DM generating content with the following settings:\n\nChoice:\n- ${choice}\n\nBiome:\n- ${biome}\n\nFeatures:\n- ${features}\n\nConstriction:\n- ${constriction}\n\nText Style:\n- ${textStyle}\n<</SYS>>\n\n${message}\n\nStyle: ${textStyle} [/INST]`;

    // Mock API response
    const response = {
        message: `AI Response to: ${message}`,
        systemMessage,
    };

    return json(response);
}

export default function ChatRoute() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [choice, setChoice] = useState("NPC");
    const [biome, setBiome] = useState("Forest");
    const [features, setFeatures] = useState("Magic");
    const [constriction, setConstriction] = useState("None");
    const [textStyle, setTextStyle] = useState("Descriptive");
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const DropdownSelect = ({
        options,
        value,
        onChange,
        label
    }: {
        options: DropdownOption[],
        value: string,
        onChange: (value: string) => void,
        label: string
    }) => (
        <div className="relative group w-full sm:w-auto">
            <select
                className="w-full sm:w-auto bg-gray-800 text-white border border-red-500 rounded px-2 sm:px-3 2xl:px-4 py-1 2xl:py-2 text-xs sm:text-sm 2xl:text-base focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[120px] 2xl:min-w-[180px]"
                onChange={(e) => onChange(e.target.value)}
                value={value}
            >
                <option value="">{label}</option>
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs 2xl:text-sm rounded p-2 2xl:p-3 shadow-lg border border-red-500 w-48 2xl:w-64 mt-1">
                {options.find(opt => opt.value === value)?.description || `Select a ${label.toLowerCase()}`}
            </div>
        </div>
    );

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        try {
            setIsLoading(true);
            const response = await fetch("http://localhost:1025/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: formData.get("message") as string,
                    system_message: `<s>[INST] <<SYS>>\nI assume role as DM generating content with the following settings:\n\nChoice:\n- ${formData.get("choice")}\n\nBiome:\n- ${formData.get("biome")}\n\nFeatures:\n- ${formData.get("features")}\n\nConstriction:\n- ${formData.get("constriction")}\n\nText Style:\n- ${formData.get("textStyle")}\n<</SYS>>\n\n${formData.get("message")}\n\nStyle: ${formData.get("textStyle")} [/INST]`
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            const data = await response.json();

            // Add user message
            const userMessage: Message = {
                id: Date.now().toString(),
                text: formData.get("message") as string,
                sender: "user",
                timestamp: new Date(),
            };

            // Add AI response
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                sender: "assistant",
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, userMessage, aiMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black py-4 sm:py-8 md:py-12 2xl:py-16">
            <div className="max-w-4xl 2xl:max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 2xl:px-12">
                <div className="text-center mb-4 sm:mb-6 md:mb-8 2xl:mb-12">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl 2xl:text-7xl font-extrabold text-white">
                        <span className="block">D&D AI Dungeon Master</span>
                        <span className="block text-red-500">Craft Your Fantasy World</span>
                    </h1>
                    <p className="mt-2 sm:mt-3 2xl:mt-6 max-w-md 2xl:max-w-2xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-gray-300">
                        Embark on a journey of world-building and storytelling. Create NPCs, design locations, craft quests, and weave tales of adventure in your fantasy realm.
                    </p>
                </div>

                {/* Settings Dropdowns */}
                <div className="bg-gray-900 shadow-xl rounded-xl sm:rounded-2xl overflow-hidden border border-red-500 p-2 sm:p-4 md:p-6 2xl:p-8 mb-4 sm:mb-6 2xl:mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 2xl:gap-6">
                        <div className="flex flex-col items-center space-y-1 2xl:space-y-2">
                            <label className="text-xs 2xl:text-base text-gray-400">Choice</label>
                            <DropdownSelect
                                options={CHOICE_OPTIONS}
                                value={choice}
                                onChange={setChoice}
                                label="Select Choice"
                            />
                        </div>
                        <div className="flex flex-col items-center space-y-1 2xl:space-y-2">
                            <label className="text-xs 2xl:text-base text-gray-400">Biome</label>
                            <DropdownSelect
                                options={BIOME_OPTIONS}
                                value={biome}
                                onChange={setBiome}
                                label="Select Biome"
                            />
                        </div>
                        <div className="flex flex-col items-center space-y-1 2xl:space-y-2">
                            <label className="text-xs 2xl:text-base text-gray-400">Features</label>
                            <DropdownSelect
                                options={FEATURES_OPTIONS}
                                value={features}
                                onChange={setFeatures}
                                label="Select Features"
                            />
                        </div>
                        <div className="flex flex-col items-center space-y-1 2xl:space-y-2">
                            <label className="text-xs 2xl:text-base text-gray-400">Constriction</label>
                            <DropdownSelect
                                options={CONSTRICTION_OPTIONS}
                                value={constriction}
                                onChange={setConstriction}
                                label="Select Constriction"
                            />
                        </div>
                        <div className="flex flex-col items-center space-y-1 2xl:space-y-2">
                            <label className="text-xs 2xl:text-base text-gray-400">Text Style</label>
                            <DropdownSelect
                                options={TEXT_STYLE_OPTIONS}
                                value={textStyle}
                                onChange={setTextStyle}
                                label="Select Style"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 shadow-xl rounded-xl sm:rounded-2xl overflow-hidden border border-red-500">
                    <Chat
                        messages={messages}
                        onSendMessage={handleSubmit}
                        isSubmitting={isLoading}
                        choice={choice}
                        setChoice={setChoice}
                        biome={biome}
                        setBiome={setBiome}
                        features={features}
                        setFeatures={setFeatures}
                        constriction={constriction}
                        setConstriction={setConstriction}
                        textStyle={textStyle}
                        setTextStyle={setTextStyle}
                    />
                </div>
            </div>
        </div>
    );
}
