import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Welcome to D&D AI Dungeon Master" },
    { name: "description", content: "Your AI-powered Dungeon Master for creating immersive fantasy worlds and adventures. Craft NPCs, design locations, and weave tales of adventure in your fantasy realm." },
    { name: "keywords", content: "D&D, Dungeons & Dragons, AI Dungeon Master, fantasy roleplay, tabletop RPG, DM tools, world building" },
    { property: "og:title", content: "Welcome to D&D AI Dungeon Master" },
    { property: "og:description", content: "Create immersive fantasy worlds and adventures with AI-powered storytelling." },
    { property: "og:type", content: "website" },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Hero Section */}
      <div className="bg-gray-900 border-b border-red-500 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Welcome to</span>
              <span className="block text-red-500">D&D AI Dungeon Master</span>
            </h1>
            <p className="mt-2 text-sm text-gray-300 sm:text-base max-w-2xl mx-auto">
              Save hours of preparation time with our AI-powered tool that generates everything you need for your D&D campaigns.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gray-900 shadow-xl rounded-xl overflow-hidden border border-red-500 p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-red-500 mb-2">What We Generate</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div className="p-3 bg-gray-800 rounded-lg border border-red-500">
                    <h3 className="font-semibold text-red-400 mb-1">NPCs & Characters</h3>
                    <p>Detailed backstories, personalities, and motivations</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg border border-red-500">
                    <h3 className="font-semibold text-red-400 mb-1">Locations & Settings</h3>
                    <p>Rich environments, towns, and dungeons</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg border border-red-500">
                    <h3 className="font-semibold text-red-400 mb-1">Quests & Adventures</h3>
                    <p>Engaging storylines and plot hooks</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg border border-red-500">
                    <h3 className="font-semibold text-red-400 mb-1">World Building</h3>
                    <p>Lore, history, and cultural details</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                <Link
                  to="/chat"
                  className="w-full sm:w-auto px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  Start Chatting
                </Link>
                <a
                  href="https://mrdjan.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm border border-red-500"
                >
                  Visit Website
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-red-500 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-sm text-gray-400">
              © 2024 D&D AI Dungeon Master. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                to="/contact"
                className="text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
