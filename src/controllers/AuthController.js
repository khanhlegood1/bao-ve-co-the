const User = require('../models/User');
const webhookService = require('../services/WebhookService');

/**
 * Xử lý đăng ký tài khoản cho User 2 qua link Affiliate của User 1
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã tồn tại trên hệ thống.' });
    }

    // Tìm kiếm User 1 (Referrer) dựa vào mã referralCode (ở đây giả định referralCode là ID của User 1)
    let referrer = null;
    if (referralCode) {
      referrer = await User.findById(referralCode);
    }

    // Tạo User 2
    const newUser = new User({
      username,
      email,
      password, // Lưu ý: Cần hash password bằng bcrypt trước khi lưu trong thực tế
      referrerId: referrer ? referrer._id : null
    });

    await newUser.save();

    // Nếu tồn tại User 1 và User 1 đã cài đặt Webhook URL, kích hoạt gửi webhook bất đồng bộ
    if (referrer && referrer.webhookUrl) {
      // Gọi bất đồng bộ không block response trả về cho User 2
      webhookService.triggerReferralWebhook(referrer, newUser).catch(err => {
        console.error('Lỗi khi kích hoạt webhook:', err);
      });
    }

    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công.',
      userId: newUser._id,
      referredBy: referrer ? referrer.username : null
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    return res.status(500).json({ message: 'Có lỗi xảy ra từ máy chủ.' });
  }
};