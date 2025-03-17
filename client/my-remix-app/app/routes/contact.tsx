import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
    return [
        { title: "Contact - D&D AI Dungeon Master" },
        { name: "description", content: "Contact the D&D AI Dungeon Master team. Get in touch for support, feedback, or collaboration opportunities in the world of Dungeons & Dragons and AI-powered storytelling." },
        { name: "keywords", content: "D&D, Dungeons & Dragons, AI Dungeon Master, contact, support, DM tools, fantasy roleplay, tabletop RPG" },
        { property: "og:title", content: "Contact - D&D AI Dungeon Master" },
        { property: "og:description", content: "Get in touch with the D&D AI Dungeon Master team for support and collaboration." },
        { property: "og:type", content: "website" },
    ];
};

export default function Contact() {
    return (
        <div className="min-h-screen bg-black py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
                        <span className="block">Contact Us</span>
                        <span className="block text-red-500">Get in Touch</span>
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Have questions about our AI Dungeon Master? We're here to help!
                    </p>
                </div>

                <div className="bg-gray-900 shadow-xl rounded-2xl overflow-hidden border border-red-500 p-8">
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-red-500 mb-4">Contact Information</h2>
                            <p className="text-gray-300">
                                For support, feedback, or collaboration opportunities, reach out to us at:
                            </p>
                            <a
                                href="mailto:contact@mrdjan.net"
                                className="inline-block mt-2 text-xl font-semibold text-red-400 hover:text-red-500 transition-colors"
                            >
                                contact@mrdjan.net
                            </a>
                        </div>

                        <div className="border-t border-red-500 pt-6">
                            <h3 className="text-xl font-bold text-red-500 mb-4">About D&D AI Dungeon Master</h3>
                            <p className="text-gray-300 mb-4">
                                D&D AI Dungeon Master is your innovative tool for creating immersive fantasy worlds and adventures.
                                Whether you're a seasoned Dungeon Master or just starting your journey in the world of Dungeons & Dragons,
                                our AI-powered platform helps you craft compelling narratives, design memorable NPCs, and build rich,
                                detailed environments for your campaigns.
                            </p>
                            <p className="text-gray-300">
                                We're committed to enhancing your D&D experience with cutting-edge AI technology,
                                making world-building and storytelling more accessible and engaging than ever before.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 