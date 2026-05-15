import { getComments, createComment } from "./commenting.repo";

export async function handleCreateComment(data: any){
    const { user, comment, filter } = data;
    // all of them seperate :string
    const res = await createComment(user, comment, filter);
    return res;
}

export async function handleGetComments(){
    const res = await getComments();
    return res;
}