import { Response } from "express";
import { handleCreateComment, handleGetComments } from "./commenting.service";

export async function createComment(req: any, res: Response) {
    try {
        const result = await handleCreateComment(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        console.error("Error creating comment:", error);
        res.status(500).json({ error: "Failed to create comment" });
    }
}

export async function getComments(req: any, res: Response) {
    try {
        const result = await handleGetComments();
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
}