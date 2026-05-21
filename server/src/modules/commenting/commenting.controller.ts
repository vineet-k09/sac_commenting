import { Response } from "express";
import { handleCreateComment, handleGetComments } from "./commenting.service";
// repo -> database DATABASE
// service -> business logic, validation, etc. BUSINESS LOGIC 
// controller -> failure, request, resposnse, status code API
export async function createComment(req: any, res: Response) {
    try {
        console.log("Received create comment request:", req.body);
        const result = await handleCreateComment(req.body);
        res.status(201).json(result); // 201 Created, 200 suceess
    } catch (error: any) {
        console.error("Error creating comment:", error);
        res.status(500).json({ error: "Failed to create comment" }); // 500 intersal server errors
    }
}

export async function getComments(req: any, res: Response) {
    try {
        const filter = req.query?.filter || undefined;
        const result = await handleGetComments(filter);
        console.log("Received get comments request", result);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
}