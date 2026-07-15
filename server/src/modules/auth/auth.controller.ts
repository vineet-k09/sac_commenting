import { Request, Response } from "express";
import { getUserRole as getRole, saveUserRole as setRole } from "./auth.repo";

export async function getUser(req: Request, res: Response) {
    try {
        // req.body.username is set by gcpAuthMiddleware from 'x-goog-authenticated-user-email'
        const email = req.body?.username || 'guest.user@datalinksoftware.com';
        const role = await getRole(email);
        
        const result = {
            email,
            role,
            success: true
        }
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Error getting user:", error);
        res.status(500).json({ error: "Failed to get user info" });
    }
}

export async function getUserRole(req: Request, res: Response) {
    try {
        const email = req.query.email as string;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        const role = await getRole(email);
        res.status(200).json({ role });
    } catch (error: any) {
        console.error("Error fetching role:", error);
        res.status(500).json({ error: "Failed to fetch user role" });
    }
}

export async function saveUserRole(req: Request, res: Response) {
    try {
        const { email, role } = req.body;
        if (!email || !role) {
            return res.status(400).json({ error: "Email and role are required" });
        }
        const result = await setRole(email, role);
        res.status(200).json({ success: result.success });
    } catch (error: any) {
        console.error("Error saving role:", error);
        res.status(500).json({ error: "Failed to save user role" });
    }
}