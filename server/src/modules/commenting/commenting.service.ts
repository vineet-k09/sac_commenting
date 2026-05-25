import { getComments, createComment, deleteComment, putComment } from "./commenting.repo";
import { Comment } from "./commenting.types";

export async function handleCreateComment(data: Comment){
    const { user, content, level, filter } = data;
    const res = await createComment(user, content, level, filter);
    return res;
}

export async function handleGetComments(filter?: string){
    const res = await getComments(filter);
    return res;
}

export async function handleDeleteComment(id: string){
    const res = await deleteComment(id);
    return res;
}

export async function handlePutComment(id: string, data: Comment){
    const {user, content, level, filter} = data;
    const res = await putComment(id, user, content, level, filter);
    return res;
}

export const dummy_comments = [
    {user: "Alice", content: "This is a great article!", level: "page", filter: "apple:red;banana:yellow", timestamp: new Date().toISOString()},
    {user: "Bob", content: "I disagree with the points made here.", level: "page", filter: "apple:green;banana:yellow", timestamp: new Date().toISOString()},
    {user: "Charlie", content: "Can you provide more details?", level: "page", filter: "apple:red;banana:green", timestamp: new Date().toISOString()},
]