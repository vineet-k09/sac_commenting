import { getComments, createComment } from "./commenting.repo";

export async function handleCreateComment(data: any){
    const { user, comment, filter } = data;
    const res = await createComment(user, comment, filter); // 
    return res;
}

export async function handleGetComments(filter?: string){
    const res = await getComments(filter);
    return res;
}

export const dummy_comments = [
    {user: "Alice", comment: "This is a great article!", filter: "apple:red;banana:yellow"},
    {user: "Bob", comment: "I disagree with the points made here.", filter: "apple:green;banana:yellow"},
    {user: "Charlie", comment: "Can you provide more details?", filter: "apple:red;banana:green"},
]