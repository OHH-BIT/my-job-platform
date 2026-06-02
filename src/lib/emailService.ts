import nodemailer from 'nodemailer';

// 创建邮件发送器（transporter）
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'qq', // 默认使用QQ邮箱，可在.env中配置
  auth: {
    user: process.env.EMAIL_USER, // 你的邮箱账号，例如 '123456@qq.com'
    pass: process.env.EMAIL_PASS  // 你刚刚获取的 SMTP 授权码
  }
});

// 封装发送验证码的函数
export async function sendVerificationEmail(
  toEmail: string,
  code: string,
  options?: {
    subject?: string;
    fromName?: string;
  }
): Promise<boolean> {
  const {
    subject = '【求职助手】您的登录验证码',
    fromName = '求职助手'
  } = options || {};

  const mailOptions = {
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: subject,
    text: `您的验证码是：${code}，请在 5 分钟内完成验证。请勿泄露给他人。`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">邮箱验证码</h2>
        <p>您好！</p>
        <p>您正在使用邮箱验证码登录/注册 <strong>求职助手</strong>，您的验证码是：</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #1890ff; letter-spacing: 5px;">${code}</span>
        </div>
        <p style="color: #666;">验证码将在 <strong>5 分钟</strong> 后失效，请尽快完成验证。</p>
        <p style="color: #999; font-size: 12px;">如果您并未请求此验证码，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ 验证码邮件已成功发送至 ${toEmail}`, info.messageId);
    return true;
  } catch (error) {
    console.error('❌ 邮件发送失败：', error);
    return false;
  }
}

// 封装发送通用邮件的函数（可用于发送通知、提醒等）
export async function sendEmail(
  toEmail: string,
  subject: string,
  htmlContent: string,
  options?: {
    fromName?: string;
    textContent?: string;
  }
): Promise<boolean> {
  const {
    fromName = '求职助手',
    textContent
  } = options || {};

  const mailOptions = {
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: subject,
    text: textContent || subject,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ 邮件已成功发送至 ${toEmail}`, info.messageId);
    return true;
  } catch (error) {
    console.error('❌ 邮件发送失败：', error);
    return false;
  }
}

// 验证邮件配置是否正确
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ 邮件服务配置正确');
    return true;
  } catch (error) {
    console.error('❌ 邮件服务配置错误：', error);
    return false;
  }
}
