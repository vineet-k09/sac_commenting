import { Router } from "express";
import { getUser, getUserRole, saveUserRole } from "./auth.controller";
import { gcpAuthMiddleware } from "../../middlewares/username"
const router = Router();

router.post('/me', gcpAuthMiddleware, getUser);
router.get('/user/role', getUserRole);
router.post('/user/role', saveUserRole);

export default router