import { Router } from "express";
import { createComment, getComments } from "./commenting.controller";
const router = Router();

router.post('/comment', createComment);
router.get('/comment', getComments);
export default router;