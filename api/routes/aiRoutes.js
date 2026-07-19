const express = require("express");
const router = express.Router();
const { chatWithDoctor } = require("../controllers/aiController");

// Route POST gửi tin nhắn đến AI Doctor
router.post("/chat", chatWithDoctor);

module.exports = router;