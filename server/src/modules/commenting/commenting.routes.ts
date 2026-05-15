import { Router } from "express";
import { createComment, getComments } from "./commenting.controller";
const router = Router();

router.post('/create', createComment);
router.post('/get', getComments);

export default router;