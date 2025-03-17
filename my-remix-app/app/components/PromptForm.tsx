import { Form } from "@remix-run/react";

interface PromptFormProps {
    onSubmit?: (data: any) => void;
}

export default function PromptForm({ onSubmit }: PromptFormProps) {
    return (
        <Form method="post" className="space-y-6">
            <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                    Prompt
                </label>
                <input
                    type="text"
                    id="prompt"
                    name="prompt"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your prompt..."
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Describe what you want to achieve..."
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="system" className="block text-sm font-medium text-gray-700">
                        System
                    </label>
                    <select
                        id="system"
                        name="system"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select a system</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="claude-3">Claude 3</option>
                        <option value="claude-2">Claude 2</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="style" className="block text-sm font-medium text-gray-700">
                        Style
                    </label>
                    <select
                        id="style"
                        name="style"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select a style</option>
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="technical">Technical</option>
                        <option value="creative">Creative</option>
                    </select>
                </div>
            </div>

            <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Generate
            </button>
        </Form>
    );
} 