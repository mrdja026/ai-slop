import type { LoaderFunctionArgs } from "@remix-run/node";
import { Suspense } from "react";
import LazyTimer from "~/components/LazyTimer";

// Simulated todos data
const todos = [
    { id: 1, title: "Learn Remix", completed: true },
    { id: 2, title: "Build a todo app", completed: false },
    { id: 3, title: "Master TypeScript", completed: false },
    { id: 4, title: "Deploy to production", completed: false },
    { id: 5, title: "Write documentation", completed: false },
];

export async function loader({ request }: LoaderFunctionArgs) {
    // Simulate a 3-second delay
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return todos;
}

export default function LazyTimerRoute() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Lazy Timer Demo</h1>

                <Suspense fallback={
                    <div className="p-6 bg-white rounded-lg shadow animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                }>
                    {/* <LazyTimer /> */}
                </Suspense>
            </div>
        </div>
    );
} 