import { Form } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import Spinner from "./Spinner";

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

interface ChatProps {
    messages: Message[];
    onSendMessage: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
    isSubmitting: boolean;
    choice: string;
    setChoice: (value: string) => void;
    biome: string;
    setBiome: (value: string) => void;
    features: string;
    setFeatures: (value: string) => void;
    constriction: string;
    setConstriction: (value: string) => void;
    textStyle: string;
    setTextStyle: (value: string) => void;
}

export default function Chat({
    messages,
    onSendMessage,
    isSubmitting,
    choice,
    setChoice,
    biome,
    setBiome,
    features,
    setFeatures,
    constriction,
    setConstriction,
    textStyle,
    setTextStyle,
}: ChatProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!input.trim()) return;

        await onSendMessage(event);
        setInput("");
    };

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
        <div className="relative group">
            <select
                className="bg-gray-800 text-white border border-red-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[120px]"
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
            <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded p-2 shadow-lg border border-red-500 w-48 mt-1">
                {options.find(opt => opt.value === value)?.description || `Select a ${label.toLowerCase()}`}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] 2xl:h-[800px]">
            {/* Chat Header */}
            <div className="p-4 2xl:p-6 border-b border-red-500">
                <h2 className="text-xl 2xl:text-3xl font-bold text-red-500">Chat with AI DM</h2>
                <p className="text-sm 2xl:text-lg text-gray-400 mt-1 2xl:mt-2">
                    {`Format your prompt as: "I assume role as DM generating ${choice} with ${constriction} ${biome} ${textStyle} ${features}"`}
                </p>
            </div>

            {/* Settings Display */}
            <div className="p-3 2xl:p-5 bg-gray-800 border-b border-red-500">
                <p className="text-sm 2xl:text-lg text-gray-300">
                    I assume role as DM and settings are:
                </p>
                <div className="mt-1 2xl:mt-2 text-xs 2xl:text-base text-gray-400 space-y-0.5 2xl:space-y-1">
                    <p>Choice: {choice}</p>
                    <p>Biome: {biome}</p>
                    <p>Features: {features}</p>
                    <p>Constriction: {constriction}</p>
                    <p>Text Style: {textStyle}</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 2xl:p-6 space-y-2 sm:space-y-3 md:space-y-4 2xl:space-y-6">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 2xl:p-4 ${message.sender === "user"
                                ? "bg-red-500 text-white"
                                : "bg-gray-800 text-white"
                                }`}
                        >
                            <p className="text-sm sm:text-base 2xl:text-lg">{message.text}</p>
                            <span className="text-xs 2xl:text-sm opacity-75 mt-1 2xl:mt-2 block">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
                {isSubmitting && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 text-white rounded-lg p-2 sm:p-3 2xl:p-4">
                            <div className="flex items-center space-x-2 2xl:space-x-3">
                                <Spinner />
                                <span className="text-sm 2xl:text-lg text-gray-400">AI is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="border-t border-gray-700 p-2 sm:p-3 md:p-4 2xl:p-6">
                <Form onSubmit={handleSubmit} className="flex space-x-2 sm:space-x-3 md:space-x-4 2xl:space-x-6">
                    <input
                        type="text"
                        name="message"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-800 text-white rounded-lg px-3 sm:px-4 2xl:px-6 py-2 2xl:py-3 text-sm sm:text-base 2xl:text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-red-500 text-white px-4 sm:px-6 2xl:px-8 py-2 2xl:py-3 rounded-lg text-sm sm:text-base 2xl:text-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {isSubmitting ? "Sending..." : "Send"}
                    </button>
                </Form>
            </div>
        </div>
    );
}
