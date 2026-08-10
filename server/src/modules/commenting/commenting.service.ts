import { getComments, createComment, deleteComment, putComment } from "./commenting.repo";
import { Comment } from "./commenting.types";

export async function handleCreateComment(data: Comment, username?: string) {
    const { content, level, filter, dashboard, wb_keys } = data;

    // Backend defaults
    const is_private = data.is_private ?? false;
    const is_locked = data.is_locked ?? false;

    // Server is source of truth for identity, fallback to data.user or Anonymous
    const finalUser = username || data.user || 'Anonymous';

    console.log(`[Create Comment] User: ${finalUser}, Level: ${level}, Dashboard: ${dashboard || 'none'}`);

    const res = await createComment(finalUser, content, level, filter, dashboard, wb_keys, is_private, is_locked);
    return res;
}

export async function handleGetComments(filter?: string) {
    const res = await getComments(filter);
    return res;
}

export async function handleDeleteComment(id: string) {
    console.log(`[Delete Comment] ID: ${id}`);
    const res = await deleteComment(id);
    return res;
}

export async function handlePutComment(id: string, data: Comment, username?: string) {
    const { content, level, filter } = data;

    // Backend defaults
    const is_private = data.is_private ?? false;
    const is_locked = data.is_locked ?? false;

    // Server is source of truth for identity
    const modifierUser = username || data.user || 'Anonymous';

    console.log(`[Update Comment] ID: ${id}, ModifiedBy: ${modifierUser}`);

    const res = await putComment(id, data.user || modifierUser, content, level, filter, modifierUser, is_private, is_locked);
    return res;
}

export const dummy_comments = [
    { user: "Alice", content: "This is a great article!", level: "page", filter: "apple:red;banana:yellow", timestamp: new Date().toISOString() },
    { user: "Bob", content: "I disagree with the points made here.", level: "page", filter: "apple:green;banana:yellow", timestamp: new Date().toISOString() },
    { user: "Charlie", content: "Can you provide more details?", level: "page", filter: "apple:red;banana:green", timestamp: new Date().toISOString() },
]