import { Router } from "express";
import { createComment, getComments, deleteComment, putComment } from "./commenting.controller";
const router = Router();

router.post('/comment', createComment);
router.get('/comment', getComments);
router.put('/comment/:id', putComment);
router.delete('/comment/:id', deleteComment);
export default router;