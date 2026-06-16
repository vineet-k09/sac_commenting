import { Request, Response } from "express";
import { handleRephrase, handleSummarize } from "./generation.service";

const COMMENT_LIMIT = parseInt(process.env.AI_COMMENT_LIMIT || "45", 10);

// TODO: Add a proxy - URL - layer that connects with the AI - look into tags and flags
// Know about the thresholds (for ai prod), 
// Get aibooster, check into other images, - spd sec accessment -
// Cloudrun api for encrypt, decrypt (anomization, de-a), rotation ~ 90days -> $$$$$$  
// Check for dual deployment with tokens 
// 
export async function rephraseComment(req: Request, res: Response) {
    try {
        const { user_comment } = req.body;
        if (!user_comment) {
            return res.status(400).json({ error: "user_comment is required" });
        }
        const result = await handleRephrase(user_comment);
        res.status(200).json({ comment: result });
    } catch (error: any) {
        console.error("Error rephrasing comment:", error);
        res.status(500).json({ error: "Failed to rephrase comment" });
    }
}

export async function summarizeComment(req: Request, res: Response) {
    try {
        const { comments, level } = req.body;
        if (!comments || !Array.isArray(comments)) {
            return res.status(400).json({ error: "comments array is required" });
        }

        // Enforce limit and keep most recent comments to prevent model abuse
        // TODO: Enforce this limit from frontend
        const trimmedComments = comments.slice(0, COMMENT_LIMIT);

        const filteredComments = trimmedComments.map((c: any) => ({
            level: c.level,
            content: c.content,
            filter: c.filter
        }));

        const result = await handleSummarize(filteredComments, level);
        res.status(200).json({ summary: result });
    } catch (error: any) {
        console.error("Error summarizing comment:", error);
        res.status(500).json({ error: "Failed to summarize comment" });
    }
}