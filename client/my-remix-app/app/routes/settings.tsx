import type { MetaFunction } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { useState } from "react";

export const meta: MetaFunction = () => {
    return [
        { title: "Settings - D&D AI Dungeon Master" },
        { name: "description", content: "Manage your account settings, including email, password, and avatar." },
        { property: "og:title", content: "Settings - D&D AI Dungeon Master" },
        { property: "og:description", content: "Manage your account settings and preferences." },
        { property: "og:type", content: "website" },
    ];
};

export default function Settings() {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-black py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-gray-900 shadow-xl rounded-xl overflow-hidden border border-red-500 p-6">
                    <h1 className="text-2xl font-bold text-red-500 mb-6 text-center">Account Settings</h1>

                    <div className="space-y-8">
                        {/* Avatar Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">Profile Picture</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-red-500 overflow-hidden">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm text-gray-300 mb-2">Upload new avatar</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="block w-full text-sm text-gray-300
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-red-500 file:text-white
                      hover:file:bg-red-600
                      cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">Email Address</h2>
                            <Form method="post" className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
                                        New Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="w-full px-4 py-2 bg-gray-800 border border-red-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Enter new email"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirmEmail" className="block text-sm text-gray-300 mb-2">
                                        Confirm New Email
                                    </label>
                                    <input
                                        type="email"
                                        id="confirmEmail"
                                        name="confirmEmail"
                                        className="w-full px-4 py-2 bg-gray-800 border border-red-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Confirm new email"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Update Email
                                </button>
                            </Form>
                        </div>

                        {/* Password Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">Password</h2>
                            <Form method="post" className="space-y-4">
                                <div>
                                    <label htmlFor="currentPassword" className="block text-sm text-gray-300 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        name="currentPassword"
                                        className="w-full px-4 py-2 bg-gray-800 border border-red-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm text-gray-300 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        className="w-full px-4 py-2 bg-gray-800 border border-red-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm text-gray-300 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="w-full px-4 py-2 bg-gray-800 border border-red-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Update Password
                                </button>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 