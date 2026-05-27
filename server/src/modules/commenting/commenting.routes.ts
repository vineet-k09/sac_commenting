import { Router } from "express";
import { createComment, getComments, deleteComment, putComment } from "./commenting.controller";
import { gcpAuthMiddleware } from "../../middlewares/username"
const router = Router();

router.post('/comment', gcpAuthMiddleware, createComment);
router.get('/comment', getComments);
router.put('/comment/:id',gcpAuthMiddleware, putComment);
router.delete('/comment/:id', deleteComment);
export default router;