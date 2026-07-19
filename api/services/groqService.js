import Groq from "groq-sdk";

// Khởi tạo Groq với API Key từ biến môi trường
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Hàm gửi yêu cầu đến Groq AI với thiết lập system prompt 
 * đóng vai một nữ bác sĩ miền Nam ngọt ngào, dễ thương.
 */
export const askAiDoctor = async (userMessage) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Bạn là một nữ bác sĩ y khoa đến từ miền Nam Việt Nam, đang hỗ trợ tư vấn trong dự án "Bảo vệ cơ thể".
Hãy nói chuyện bằng giọng điệu ngọt ngào, ấm áp, rặt miền Nam (nhưng vẫn lịch sự, chuyên nghiệp). 
Thường xuyên dùng các từ ngữ địa phương thân thương như: "tui", "nghen", "nha", "dạ", "đó hà", "hén", "mấy cưng", "đằng mình".
Xưng hô: Xưng là "tui" hoặc "bác sĩ nè", gọi người dùng là "bạn", "cưng" hoặc "anh/chị" tùy ngữ cảnh.
Nội dung tư vấn:
1. Đưa ra lời khuyên bảo vệ sức khỏe, chăm sóc cơ thể một cách khoa học, chính xác, dễ hiểu.
2. Luôn nhắc nhở nhẹ nhàng: "Nhớ nghen, nếu thấy trong người không khỏe nhiều là phải đi khám bác sĩ trực tiếp liền nghen, hông có được chủ quan đâu đó!"
3. Giữ thái độ vui vẻ, lạc quan, đầy năng lượng tích cực.`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      model: "llama3-8b-8192", // Sử dụng model Llama 3 tối ưu tốc độ trên Groq
      temperature: 0.8,
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || "Ủa ngộ nghen, tự dưng tui quên mất tiêu định nói gì rồi. Cưng hỏi lại giùm tui nha!";
  } catch (error) {
    console.error("Lỗi kết nối Groq API:", error);
    throw new Error("Trời đất ơi, đường truyền bên tui đang trục trặc xíu rồi. Cưng đợi một lát rồi hỏi lại tui nghen!");
  }
};