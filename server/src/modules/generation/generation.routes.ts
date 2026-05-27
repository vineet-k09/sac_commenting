import { Router } from "express";
import { getUploadUrl, generateComment } from "./generation.controller";
const router = Router();

router.post('/get-upload-url', getUploadUrl);
router.post('/generate-comment', generateComment);

export default router;