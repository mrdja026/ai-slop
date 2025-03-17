import type { LoaderFunctionArgs } from "@remix-run/node";

interface Todo {
    id: number;
    title: string;
    completed: boolean;
}

async function getTodos(): Promise<Todo[]> {
    // Simulate a 3-second delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return [
        { id: 1, title: "Learn Remix", completed: true },
        { id: 2, title: "Build a todo app", completed: false },
        { id: 3, title: "Master TypeScript", completed: false },
        { id: 4, title: "Deploy to production", completed: false },
        { id: 5, title: "Write documentation", completed: false },
    ];
}

export async function loader({ request }: LoaderFunctionArgs) {
    const todos = await getTodos();
    return todos;
} 