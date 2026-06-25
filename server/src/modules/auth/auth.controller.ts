import { Response } from "express";

export async function getUser(req: any, res: Response) {
    try {
        const result = {
            email: req.body?.username,
            success: true
        }
        res.status(result.success ? 200 : 500).json(result); // 201 Created, 200 suceess
    } catch (error: any) {
        console.error("Error creating comment:", error);
        res.status(500).json({ error: "Failed to create comment" }); // 500 intersal server errors
    }
}