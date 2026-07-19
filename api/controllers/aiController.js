import { askAiDoctor } from "../services/groqService.js";

/**
 * Controller xử lý yêu cầu tư vấn sức khỏe từ người dùng
 */
export const handleAiConsultation = async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ 
      success: false, 
      reply: "Trời đất ơi, cưng chưa nhập câu hỏi kìa! Nhập đi rồi tui trả lời cho nghe nghen." 
    });
  }

  try {
    const reply = await askAiDoctor(message);
    return res.status(200).json({ 
      success: true, 
      reply 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      reply: error.message || "Hệ thống bận đột xuất rồi cưng ơi, thông cảm cho tui nha!" 
    });
  }
};