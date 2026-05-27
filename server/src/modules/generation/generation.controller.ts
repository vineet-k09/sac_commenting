import { Request, Response } from "express";
import { handleGetUploadUrl, handleGenerateComment } from "./generation.service";

export async function getUploadUrl(req: Request, res: Response) {
    try {
        const { fileName } = req.body;
        if (!fileName) {
            return res.status(400).json({ error: "fileName is required" });
        }
        const result = await handleGetUploadUrl(fileName);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Error generating upload URL:", error);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
}

export async function generateComment(req: Request, res: Response) {
    try {
        const { fullPath } = req.body;
        if (!fullPath) {
            return res.status(400).json({ error: "fullPath is required" });
        }
        const result = await handleGenerateComment(fullPath);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Error generating comment:", error);
        res.status(500).json({ error: "Failed to generate comment" });
    }
}