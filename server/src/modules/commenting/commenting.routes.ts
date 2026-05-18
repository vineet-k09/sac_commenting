import { Router } from "express";
import { createComment, getComments } from "./commenting.controller";
const router = Router();

router.post('/comment', createComment);
router.get('/getAll', getComments);
// router.post('/comment?filter=:filter',getComments);

export default router;