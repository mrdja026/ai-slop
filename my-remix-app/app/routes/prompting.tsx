import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import PromptForm from "~/components/PromptForm";
import { Suspense, useEffect } from "react";
import LazyTimer from "~/components/LazyTimer";

export const meta: MetaFunction = () => {
    return [
        { title: "AI Prompt Generator" },
        { name: "description", content: "Generate effective prompts for various AI systems with our easy-to-use form." },
    ];
};

interface Todo {
    id: number;
    title: string;
    completed: boolean;
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const data = {
        prompt: formData.get("prompt"),
        description: formData.get("description"),
        system: formData.get("system"),
        style: formData.get("style"),
    };
    console.log("Form submission data:", data);
    return null;
}

export default function Prompting() {
    const fetcher = useFetcher<Todo[]>();

    useEffect(() => {
        if (!fetcher.data && fetcher.state !== "loading") {
            fetcher.load("/prompting/api/todos");
        }
    }, [fetcher]);

    const LoadingFallback = () => (
        <div className="p-6 bg-white rounded-lg shadow animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                            <span className="block">AI Prompt Generator</span>
                            <span className="block text-blue-600">Create Better Prompts</span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                            Generate effective prompts for various AI systems with our easy-to-use form. Select your system, style, and get started.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Prompt</h2>
                    <PromptForm />
                </div>
            </div>

            {/* Lazy Timer Section */}
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Loading Demo</h2>
                <Suspense fallback={<LoadingFallback />}>
                    {fetcher.data ? (
                        <LazyTimer todos={fetcher.data} />
                    ) : (
                        <LoadingFallback />
                    )}
                </Suspense>
            </div>
        </div>
    );
} 