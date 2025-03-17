import { useState } from "react";
import { Link, Outlet } from "@remix-run/react";

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-red-500 transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-48" : "w-0"
                    } overflow-hidden`}
            >
                <div className="p-3">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-red-500">User Info</h2>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="text-gray-400 hover:text-red-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="p-2 bg-gray-800 rounded-lg border border-red-500">
                            <h3 className="text-sm text-red-500 font-semibold">Profile</h3>
                            <p className="text-xs text-gray-300">User Name</p>
                            <p className="text-xs text-gray-300">user@example.com</p>
                        </div>

                        <div className="space-y-1">
                            <Link
                                to="/settings"
                                className="block px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded-lg hover:text-red-500 transition-colors"
                            >
                                Settings
                            </Link>
                            <button
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded-lg hover:text-red-500 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-48" : "ml-0"}`}>
                {/* Header */}
                <header className="bg-gray-900 border-b border-red-500 p-3">
                    <div className="flex items-center">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 text-gray-400 hover:text-white focus:outline-none"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <Link to="/" className="text-white hover:text-red-500 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </Link>
                        </div>
                        <h1 className="text-lg font-bold text-red-500">D&D AI Dungeon Master</h1>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
} 