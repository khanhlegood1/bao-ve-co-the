import express from "express";
import { handleAiConsultation } from "../controllers/aiController.js";

const router = express.Router();

// Route nhận câu hỏi tư vấn sức khỏe
router.post("/consult", handleAiConsultation);

export default router;