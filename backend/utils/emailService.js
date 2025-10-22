const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Tạo transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM,
  });
};

// Tạo token xác thực email
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Gửi email xác thực
const sendVerificationEmail = async (email, token, name) => {
  const transporter = createTransporter();

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Xác thực tài khoản - HandMade Shop',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-bottom: 3px solid #007bff;
          }
          .content {
            padding: 30px 20px;
          }
          .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HandMade Shop</h1>
          </div>
          <div class="content">
            <h2>Chào mừng bạn đến với HandMade Shop!</h2>
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại HandMade Shop. Để hoàn tất quá trình đăng ký, vui lòng xác thực địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Xác thực Email</a>
            </div>
            <p>Hoặc bạn có thể copy và paste đường link sau vào trình duyệt:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
              ${verificationUrl}
            </p>
            <p><strong>Lưu ý:</strong> Link xác thực này sẽ hết hạn sau 24 giờ.</p>
            <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>© 2025 HandMade Shop. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Gửi email reset mật khẩu
const sendPasswordResetEmail = async (email, token, name) => {
  const transporter = createTransporter();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Đặt lại mật khẩu - HandMade Shop',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-bottom: 3px solid #dc3545;
          }
          .content {
            padding: 30px 20px;
          }
          .button {
            display: inline-block;
            background-color: #dc3545;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HandMade Shop</h1>
          </div>
          <div class="content">
            <h2>Yêu cầu đặt lại mật khẩu</h2>
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại HandMade Shop.</p>
            <p>Để đặt lại mật khẩu, vui lòng nhấn vào nút bên dưới:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </div>
            <p>Hoặc bạn có thể copy và paste đường link sau vào trình duyệt:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            <div class="warning">
              <p><strong>Lưu ý quan trọng:</strong></p>
              <ul>
                <li>Link đặt lại mật khẩu này sẽ hết hạn sau 1 giờ</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                <li>Để bảo mật, hãy đảm bảo bạn là người duy nhất có quyền truy cập vào email này</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 HandMade Shop. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

module.exports = {
  generateEmailVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
};

// New: Send order confirmation email
const sendOrderConfirmationEmail = async (email, order, name) => {
  const transporter = createTransporter();

  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const orderUrl = `${appUrl}/order`;

  const itemsRows = (order?.items || [])
    .map((it) => {
      const title = it?.product?.name || 'Sản phẩm';
      const qty = it?.quantity || 0;
      const unit = Number(it?.inTimePrice || 0);
      const line = unit * qty;
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${unit.toLocaleString('vi-VN')} đ</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${line.toLocaleString('vi-VN')} đ</td>
        </tr>
      `;
    })
    .join('');

  const ship = order?.shippingAddr || {};
  const createdAt = order?.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '';
  const total = Number(order?.totalAmount || 0).toLocaleString('vi-VN');

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Xác nhận đơn hàng #${String(order?._id || '').slice(-8)} - HandMade Shop`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 680px; margin: 0 auto; font-family: Arial, sans-serif; color:#333; }
          .header { background:#f8f9fa; padding:16px 20px; border-bottom:3px solid #28a745; }
          .content { padding: 20px; }
          .btn { display:inline-block; background:#28a745; color:#fff; padding:10px 18px; border-radius:6px; text-decoration:none; }
          .muted { color:#666; font-size:13px; }
          table { width:100%; border-collapse:collapse; }
          th { background:#f4f6f8; padding:10px 12px; text-align:left; border-bottom:1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0;">HandMade Shop</h2>
          </div>
          <div class="content">
            <p>Xin chào <strong>${name || ''}</strong>,</p>
            <p>Cảm ơn bạn đã đặt hàng tại HandMade Shop. Chúng tôi đã nhận được đơn hàng của bạn.</p>

            <p><strong>Mã đơn:</strong> ${order?._id || ''}<br/>
               <strong>Ngày đặt:</strong> ${createdAt}</p>

            <h3 style="margin-top:18px;">Chi tiết đơn hàng</h3>
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th style="text-align:center;">SL</th>
                  <th style="text-align:right;">Đơn giá</th>
                  <th style="text-align:right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
                <tr>
                  <td colspan="3" style="padding:10px 12px; text-align:right;"><strong>Tổng cộng</strong></td>
                  <td style="padding:10px 12px; text-align:right;"><strong>${total} đ</strong></td>
                </tr>
              </tbody>
            </table>

            <h3 style="margin-top:18px;">Thông tin giao hàng</h3>
            <p>
              ${ship.fullName || ''} - ${ship.phone || ''}<br/>
              ${ship.addressLine || ''}, ${ship.city || ''} ${ship.postalCode || ''}
            </p>

            <p style="margin-top:18px;">
              <a class="btn" href="${orderUrl}">Xem đơn hàng của tôi</a>
            </p>
            <p class="muted">Nếu bạn không thực hiện đơn hàng này, vui lòng liên hệ hỗ trợ ngay.</p>
          </div>
          <div class="muted" style="padding:14px 20px; background:#f8f9fa;">
            © ${new Date().getFullYear()} HandMade Shop. Email được gửi tự động, vui lòng không phản hồi.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

module.exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
