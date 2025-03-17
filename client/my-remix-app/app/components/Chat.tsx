import { Form } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import Spinner from "./Spinner";

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

interface ChatProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    onSendMessage: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
    onGenerateImage: (text: string) => Promise<void>;
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
    setMessages,
    onSendMessage,
    onGenerateImage,
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
    const [generatingImage, setGeneratingImage] = useState<string | null>(null);

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

    const handleImageGeneration = async (text: string) => {
        try {
            setGeneratingImage(text);
            console.log("Starting image generation for:", text);
            await onGenerateImage(text);
        } catch (error: any) {
            console.error("Error generating image:", error);
            alert(`Failed to generate image: ${error.message || "Unknown error"}`);
        } finally {
            setGeneratingImage(null);
        }
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
            <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl rounded p-2 sm:p-3 md:p-4 lg:p-5 2xl:p-6 shadow-lg border border-red-500 w-full mt-1">
                {options.find(opt => opt.value === value)?.description || `Select a ${label.toLowerCase()}`}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-red-500 overflow-hidden">
            {/* Chat Header */}
            <div className="flex-none p-2 sm:p-3 md:p-4 lg:p-5 2xl:p-6 border-b border-red-500">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl font-bold text-red-500">Chat with AI DM</h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-gray-400 mt-1 sm:mt-2 md:mt-3 lg:mt-4 2xl:mt-5">
                    {`Format your prompt as: "I assume role as DM generating ${choice} with ${constriction} ${biome} ${textStyle} ${features}"`}
                </p>
            </div>

            {/* Settings Display */}
            <div className="flex-none p-2 sm:p-3 md:p-4 lg:p-5 2xl:p-6 bg-gray-800 border-b border-red-500">
                <p className="text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-gray-300">
                    I assume role as DM and settings are:
                </p>
                <div className="mt-1 sm:mt-2 md:mt-3 lg:mt-4 2xl:mt-5 text-xs sm:text-sm md:text-base lg:text-lg 2xl:text-xl text-gray-400 space-y-0.5 sm:space-y-1 md:space-y-2 lg:space-y-3 2xl:space-y-4">
                    <p>Choice: {choice}</p>
                    <p>Biome: {biome}</p>
                    <p>Features: {features}</p>
                    <p>Constriction: {constriction}</p>
                    <p>Text Style: {textStyle}</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 2xl:p-12 space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-7 2xl:space-y-8">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] 2xl:max-w-[75%] rounded-lg p-3 sm:p-4 md:p-5 lg:p-6 2xl:p-8 ${message.sender === "user"
                                ? "bg-red-500 text-white"
                                : "bg-gray-800 text-white"
                                }`}
                        >
                            <p className="text-base sm:text-lg md:text-xl lg:text-2xl 2xl:text-3xl whitespace-pre-wrap">{message.text}</p>
                            {message.image_base64 && (
                                <div className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 2xl:mt-8 relative group">
                                    <img
                                        src={`data:image/png;base64,${message.image_base64}`}
                                        alt="Generated content"
                                        className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(`data:image/png;base64,${message.image_base64}`, '_blank')}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                                        <span className="text-white text-base sm:text-lg md:text-xl lg:text-2xl 2xl:text-3xl">Click to view full size</span>
                                    </div>
                                </div>
                            )}
                            <span className="text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl opacity-75 mt-2 sm:mt-3 md:mt-4 lg:mt-5 2xl:mt-6 block">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                            {message.sender === "assistant" && (
                                <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5 lg:space-x-6 2xl:space-x-8 mt-3 sm:mt-4 md:mt-5 lg:mt-6 2xl:mt-8 border-t border-gray-700 pt-3 sm:pt-4 md:pt-5 lg:pt-6 2xl:pt-8">
                                    <button
                                        className="text-green-500 hover:text-green-400 transition-colors"
                                        title="Thumbs Up"
                                        onClick={() => console.log('Thumbs up for:', message.id)}
                                    >
                                        <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 2xl:w-10 2xl:h-10" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="text-red-500 hover:text-red-400 transition-colors"
                                        title="Thumbs Down"
                                        onClick={() => console.log('Thumbs down for:', message.id)}
                                    >
                                        <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 2xl:w-10 2xl:h-10 transform rotate-180" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                        </svg>
                                    </button>
                                    <button
                                        className={`text-blue-500 hover:text-blue-400 transition-colors ${generatingImage === message.text ? 'animate-pulse' : ''}`}
                                        title="Generate Image"
                                        onClick={() => handleImageGeneration(message.text)}
                                        disabled={generatingImage === message.text}
                                    >
                                        {generatingImage === message.text ? (
                                            <Spinner />
                                        ) : (
                                            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 2xl:w-10 2xl:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isSubmitting && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 text-white rounded-lg p-3 sm:p-4 md:p-5 lg:p-6 2xl:p-8">
                            <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5 lg:space-x-6 2xl:space-x-8">
                                <Spinner />
                                <span className="text-base sm:text-lg md:text-xl lg:text-2xl 2xl:text-3xl text-gray-400">AI is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="flex-none border-t border-gray-700 p-2 sm:p-3 md:p-4 lg:p-5 2xl:p-6 mt-auto">
                <Form onSubmit={handleSubmit} className="flex space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-5 2xl:space-x-6">
                    <input
                        type="text"
                        name="message"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-800 text-white rounded-lg px-3 sm:px-4 md:px-5 lg:px-6 2xl:px-8 py-2 sm:py-3 md:py-4 lg:py-5 2xl:py-6 text-base sm:text-lg md:text-xl lg:text-2xl 2xl:text-3xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-red-500 text-white px-4 sm:px-5 md:px-6 lg:px-8 2xl:px-10 py-2 sm:py-3 md:py-4 lg:py-5 2xl:py-6 rounded-lg text-base sm:text-lg md:text-xl lg:text-2xl 2xl:text-3xl hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {isSubmitting ? "Sending..." : "Send"}
                    </button>
                </Form>
            </div>
        </div>
    );
}
