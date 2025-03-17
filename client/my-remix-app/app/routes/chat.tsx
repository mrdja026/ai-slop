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
    image_base64?: string;
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
    const [choice, setChoice] = useState("encounter");
    const [biome, setBiome] = useState("forest");
    const [features, setFeatures] = useState("with combat");
    const [constriction, setConstriction] = useState("with no magic");
    const [textStyle, setTextStyle] = useState("in a descriptive style");
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

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
        <div className="relative group w-full">
            <select
                className="w-full bg-gray-800 text-white border border-red-500 rounded px-2 sm:px-3 md:px-4 lg:px-5 2xl:px-6 py-1 sm:py-2 md:py-3 lg:py-4 2xl:py-5 text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <div className="absolute z-50 invisible group-hover:visible bg-gray-900 text-white text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl rounded p-2 sm:p-3 md:p-4 lg:p-5 2xl:p-6 shadow-lg border border-red-500 w-full mt-1">
                {options.find(opt => opt.value === value)?.description || `Select a ${label.toLowerCase()}`}
            </div>
        </div>
    );

    const handleImageGeneration = async (text: string) => {
        try {
            setIsLoading(true);
            const response = await fetch("http://localhost:1025/generate-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: text,
                    negative_prompt: "blurry, low quality, distorted, deformed, disfigured, bad anatomy, ugly, duplicate, error",
                    num_steps: 30,
                    guidance_scale: 7.5,
                    height: 768,
                    width: 512
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate image");
            }

            const data = await response.json();

            if (data.success && data.image_base64) {
                // Add the generated image as a new message
                const imageMessage: Message = {
                    id: (Date.now() + 2).toString(),
                    text: "Generated image based on: " + text,
                    sender: "assistant",
                    timestamp: new Date(),
                    image_base64: data.image_base64
                };

                setMessages(prev => [...prev, imageMessage]);
            }
        } catch (error) {
            console.error("Error generating image:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        // Validate dropdown values
        const missingFields = [];
        if (!choice || choice === "") missingFields.push("Choice");
        if (!biome || biome === "") missingFields.push("Biome");
        if (!features || features === "") missingFields.push("Features");
        if (!textStyle || textStyle === "") missingFields.push("Text Style");

        if (missingFields.length > 0) {
            alert(`Please select values for: ${missingFields.join(", ")}`);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("http://localhost:1025/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: formData.get("message") as string,
                    system_message: `<s>[INST] <<SYS>>\nI assume role as DM generating content with the following settings:\n\nChoice:\n- ${choice}\n\nBiome:\n- ${biome}\n\nFeatures:\n- ${features}\n\nConstriction:\n- ${constriction}\n\nText Style:\n- ${textStyle}\n<</SYS>>\n\n${formData.get("message")}\n\nStyle: ${textStyle} [/INST]`
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
            alert("Failed to generate response. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <div className="flex-1 container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 2xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10 2xl:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 lg:gap-10 2xl:gap-12 h-full">
                    {/* Settings Column */}
                    <div className="lg:col-span-3 2xl:col-span-2 bg-gray-800 rounded-lg border border-red-500 p-4 sm:p-6 md:p-8 lg:p-10 2xl:p-12 overflow-y-auto">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl font-bold text-red-500 mb-4 sm:mb-6 md:mb-8 lg:mb-10 2xl:mb-12">Settings</h2>
                        <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10 2xl:space-y-12">
                            {/* Choice */}
                            <div>
                                <label className="block text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-gray-300 mb-2 sm:mb-3 md:mb-4 lg:mb-5 2xl:mb-6">
                                    Choice
                                </label>
                                <select
                                    value={choice}
                                    onChange={(e) => setChoice(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-lg px-3 sm:px-4 md:px-5 lg:px-6 2xl:px-8 py-2 sm:py-3 md:py-4 lg:py-5 2xl:py-6 text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="encounter">Encounter</option>
                                    <option value="location">Location</option>
                                    <option value="npc">NPC</option>
                                    <option value="quest">Quest</option>
                                </select>
                            </div>

                            {/* Biome */}
                            <div>
                                <label className="block text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-gray-300 mb-2 sm:mb-3 md:mb-4 lg:mb-5 2xl:mb-6">
                                    Biome
                                </label>
                                <select
                                    value={biome}
                                    onChange={(e) => setBiome(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-lg px-3 sm:px-4 md:px-5 lg:px-6 2xl:px-8 py-2 sm:py-3 md:py-4 lg:py-5 2xl:py-6 text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="forest">Forest</option>
                                    <option value="mountain">Mountain</option>
                                    <option value="desert">Desert</option>
                                    <option value="swamp">Swamp</option>
                                    <option value="coast">Coast</option>
                                    <option value="city">City</option>
                                </select>
                            </div>

                            {/* Features */}
                            <div>
                                <label className="block text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-gray-300 mb-2 sm:mb-3 md:mb-4 lg:mb-5 2xl:mb-6">
                                    Features
                                </label>
                                <select
                                    value={features}
                                    onChange={(e) => setFeatures(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-lg px-3 sm:px-4 md:px-5 lg:px-6 2xl:px-8 py-2 sm:py-3 md:py-4 lg:py-5 2xl:py-6 text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="with combat">With Combat</option>
                                    <option value="with exploration">With Exploration</option>
                                    <option value="with social interaction">With Social Interaction</option>
                                    <option value="with puzzle">With Puzzle</option>
                                </select>
                            </div>

                            {/* Constriction */}
                            <div>
                                <label className="block text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-gray-300 mb-2 sm:mb-3 md:mb-4 lg:mb-5 2xl:mb-6">
                                    Constriction
                                </label>
                                <select
                                    value={constriction}
                                    onChange={(e) => setConstriction(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-lg px-3 sm:px-4 md:px-5 lg:px-6 2xl:px-8 py-2 sm:py-3 md:py-4 lg:py-5 2xl:py-6 text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="with no magic">With No Magic</option>
                                    <option value="with low magic">With Low Magic</option>
                                    <option value="with high magic">With High Magic</option>
                                </select>
                            </div>

                            {/* Text Style */}
                            <div>
                                <label className="block text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-gray-300 mb-2 sm:mb-3 md:mb-4 lg:mb-5 2xl:mb-6">
                                    Text Style
                                </label>
                                <select
                                    value={textStyle}
                                    onChange={(e) => setTextStyle(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-lg px-3 sm:px-4 md:px-5 lg:px-6 2xl:px-8 py-2 sm:py-3 md:py-4 lg:py-5 2xl:py-6 text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="in a descriptive style">Descriptive</option>
                                    <option value="in a concise style">Concise</option>
                                    <option value="in a dramatic style">Dramatic</option>
                                    <option value="in a humorous style">Humorous</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Chat Column */}
                    <div className="lg:col-span-9 2xl:col-span-10 flex flex-col h-full">
                        <Chat
                            messages={messages}
                            setMessages={setMessages}
                            onSendMessage={handleSubmit}
                            onGenerateImage={handleImageGeneration}
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
        </div>
    );
}
