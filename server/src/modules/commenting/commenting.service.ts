import { getComments, createComment } from "./commenting.repo";

export async function handleCreateComment(data: any){
    const { user, comment, filter } = data;
    // all of them seperate :string
    const res = await createComment(user, comment, filter);
    return res;
}

export async function handleGetComments(){
    // const res = await getComments();
    return dummy_comments;
}

export const dummy_comments = [
    {user: "Alice", comment: "This is a great article!", filter: "positive"},
    {user: "Bob", comment: "I disagree with the points made here.", filter: "negative"},
    {user: "Charlie", comment: "Can you provide more details?", filter: "neutral"},
]