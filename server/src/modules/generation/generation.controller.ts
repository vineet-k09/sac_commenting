import { Request, Response } from "express";
import { handleRephrase, handleSummarize } from "./generation.service";

const COMMENT_LIMIT = parseInt(process.env.AI_COMMENT_LIMIT || "45", 10);

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