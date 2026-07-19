const axios = require('axios');
const crypto = require('crypto');

class WebhookService {
  /**
   * Gửi thông báo Webhook đến User 1 (Referrer) khi User 2 đăng ký thành công
   * @param {Object} referrer - Đối tượng User 1 (Người sở hữu link affiliate)
   * @param {Object} refereeData - Thông tin của User 2 vừa đăng ký
   */
  async triggerReferralWebhook(referrer, refereeData) {
    if (!referrer.webhookUrl) {
      return;
    }

    const payload = {
      event: 'affiliate.registration',
      timestamp: new Date().toISOString(),
      data: {
        refereeId: refereeData._id,
        refereeUsername: refereeData.username,
        registeredAt: refereeData.createdAt
      }
    };

    const headers = {
      'Content-Type': 'application/json',
    };

    // Nếu User 1 có cấu hình secret, tiến hành ký payload để tăng tính bảo mật
    if (referrer.webhookSecret) {
      const signature = crypto
        .createHmac('sha256', referrer.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    try {
      console.log(`[Webhook] Đang gửi thông báo đến URL: ${referrer.webhookUrl}`);
      const response = await axios.post(referrer.webhookUrl, payload, {
        headers,
        timeout: 5000, // Timeout 5 giây tránh treo tiến trình
      });
      console.log(`[Webhook] Gửi thành công. HTTP Status: ${response.status}`);
    } catch (error) {
      console.error(`[Webhook] Gửi thất bại đến ${referrer.webhookUrl}:`, error.message);
      // Có thể tích hợp thêm queue (ví dụ: BullMQ) để retry tại đây nếu cần thiết
    }
  }
}

module.exports = new WebhookService();