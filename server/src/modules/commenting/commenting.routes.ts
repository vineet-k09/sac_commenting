import { Router } from "express";
import { createComment, getComments, deleteComment } from "./commenting.controller";
const router = Router();

router.post('/comment', createComment);
router.get('/comment', getComments);
router.put('/comment', (req, res) => res.status(405).json({ error: "Method yet to be implemented" }));
router.delete('/comment/:id', deleteComment);
export default router;