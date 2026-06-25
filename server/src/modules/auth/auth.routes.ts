import { Router } from "express";
import { getUser } from "./auth.controller";
import { gcpAuthMiddleware } from "../../middlewares/username"
const router = Router();

router.post('/me', gcpAuthMiddleware, getUser);

export default router