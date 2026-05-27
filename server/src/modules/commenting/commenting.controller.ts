import { Response } from "express";
import { handleCreateComment, handleGetComments, handleDeleteComment, handlePutComment } from "./commenting.service";
// repo -> database DATABASE
// service -> business logic, validation, etc. BUSINESS LOGIC 
// controller -> failure, request, resposnse, status code API
export async function createComment(req: any, res: Response) {
    try {
        const result = await handleCreateComment(req.body, req.body?.username);
        res.status(result.success ? 201 : 500).json(result); // 201 Created, 200 suceess
    } catch (error: any) {
        console.error("Error creating comment:", error);
        res.status(500).json({ error: "Failed to create comment" }); // 500 intersal server errors
    }
}

export async function getComments(req: any, res: Response) {
    try {
        const filter = req.query?.filter || undefined;
        const result = await handleGetComments(filter);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
}

export async function deleteComment(req: any, res: Response) {
    const id = req.params?.id;
    try {
        const result = await handleDeleteComment(id);
        res.status(result.success ? 201 : 500).json({ message: "Comment deleted successfully." , result});
    } catch (error: any) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ error: "Failed to delete comment" });
    }
}

export async function putComment(req: any, res: Response) {
    try {
        const id = req.params?.id;
        const result = await handlePutComment(id, req.body, req.body?.username);
        res.status(result.success ? 201 : 500).json(result);
    } catch(   error: any) {
        console.error("Error updating comment:", error);
        res.status(500).json({ error: "Failed to update comment" });
    }
}