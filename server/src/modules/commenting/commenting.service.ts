import { getComments, createComment, deleteComment } from "./commenting.repo";
import { Comment } from "./commenting.types";

export async function handleCreateComment(data: Comment){
    const { id, user, comment, filter, type, timestamp, options } = data;
    const res = await createComment(user, comment, filter ?? "", id, type, timestamp, options);
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

export const dummy_comments = [
    {user: "Alice", comment: "This is a great article!", filter: "apple:red;banana:yellow"},
    {user: "Bob", comment: "I disagree with the points made here.", filter: "apple:green;banana:yellow"},
    {user: "Charlie", comment: "Can you provide more details?", filter: "apple:red;banana:green"},
]