import { Request, Response } from "express";
import { handleRephrase, handleSummarize } from "./generation.service";

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
        const { user_comment } = req.body;
        if (!user_comment) {
            return res.status(400).json({ error: "user_comment is required" });
        }
        const result = await handleSummarize(user_comment);
        res.status(200).json({ comment: result });
    } catch (error: any) {
        console.error("Error summarizing comment:", error);
        res.status(500).json({ error: "Failed to summarize comment" });
    }
}