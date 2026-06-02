import { Router } from "express";
import { rephraseComment, summarizeComment } from "./generation.controller";
const router = Router();

router.post('/rephrase', rephraseComment);
router.post('/summarize', summarizeComment);

export default router;