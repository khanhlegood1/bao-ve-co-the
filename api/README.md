# API AI Doctor - Bảo vệ cơ thể

Thư mục chứa API giao tiếp với AI Doctor sử dụng Groq Cloud API, tối ưu hóa tốc độ phản hồi bằng tiếng Việt.

## Cấu hình môi trường

Tạo hoặc cập nhật file `.env` ở thư mục gốc của API:

```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
```

## Cài đặt thư viện bổ sung

Để chạy tính năng này, hãy đảm bảo bạn đã cài đặt SDK của Groq:

```bash
npm install groq-sdk
```

## Cách sử dụng API

### Gửi câu hỏi đến AI Doctor

- **URL:** `/api/ai/chat`
- **Method:** `POST`
- **Body JSON:**

```json
{
  "message": "Tôi bị đau đầu và mệt mỏi thì nên làm gì?",
  "history": [
    { "role": "user", "content": "Xin chào bác sĩ" },
    { "role": "assistant", "content": "Chào bạn! Tôi là trợ lý AI Doctor từ dự án Bảo vệ cơ thể. Tôi có thể giúp gì cho bạn hôm nay?" }
  ]
}
```

- **Phản hồi thành công (200 OK):**

```json
{
  "success": true,
  "reply": "Chào bạn, tình trạng đau đầu và mệt mỏi có thể do nhiều nguyên nhân như thiếu ngủ, căng thẳng, thiếu nước hoặc cảm cúm nhẹ... Bạn nên nghỉ ngơi, uống đủ nước và theo dõi thêm. Nếu triệu chứng kéo dài kèm sốt cao, hãy đến ngay cơ sở y tế gần nhất."
}