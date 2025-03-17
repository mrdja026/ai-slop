import { useLoaderData } from "@remix-run/react";

interface Todo {
    id: number;
    title: string;
    completed: boolean;
}

interface LazyTimerProps {
    todos: Todo[];
}

export default function LazyTimer({ todos }: LazyTimerProps) {
    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Lazy Loaded Todos</h2>
            <div className="space-y-2">
                {todos.map((todo) => (
                    <div
                        key={todo.id}
                        className="flex items-center p-3 bg-gray-50 rounded"
                    >
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            readOnly
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <span className={`ml-3 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                            {todo.title}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
} 