const User = require('../models/User');
const crypto = require('crypto');

/**
 * API để User 1 đăng ký hoặc cập nhật Webhook URL nhận thông báo Affiliate
 */
exports.updateWebhookSettings = async (req, res) => {
  try {
    const { userId, webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ message: 'Vui lòng cung cấp webhookUrl.' });
    }

    // Tạo một secret ngẫu nhiên nếu user chưa có để làm mã xác thực payload
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { webhookUrl, webhookSecret },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    return res.status(200).json({
      message: 'Cập nhật cấu hình Webhook thành công.',
      webhookUrl: updatedUser.webhookUrl,
      webhookSecret: updatedUser.webhookSecret,
      note: 'Hãy sử dụng webhookSecret này để kiểm tra tính hợp lệ của request tại server của bạn bằng header X-Webhook-Signature.'
    });
  } catch (error) {
    console.error('Lỗi cập nhật cấu hình Webhook:', error);
    return res.status(500).json({ message: 'Có lỗi hệ thống xảy ra.' });
  }
};