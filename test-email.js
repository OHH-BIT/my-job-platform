/**
 * 邮件发送测试脚本
 * 
 * 使用方法：
 * node test-email.js
 */

// 手动加载 .env 文件（不依赖 dotenv）
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
  console.log('✅ 已加载 .env 文件');
} else {
  console.error('❌ 未找到 .env 文件');
  process.exit(1);
}

const nodemailer = require('nodemailer');

// 调试：打印环境变量
console.log('');
console.log('🔍 调试信息：');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'undefined');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('');

// 创建邮件发送器
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'qq',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 测试邮件发送
async function testEmail() {
  console.log('📧 开始测试邮件发送...');
  console.log('📧 邮箱账号：', process.env.EMAIL_USER);
  console.log('📧 授权码：', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : '未配置');
  console.log('');

  // 验证邮件配置
  console.log('🔍 验证邮件配置...');
  try {
    await transporter.verify();
    console.log('✅ 邮件服务配置正确');
  } catch (error) {
    console.error('❌ 邮件服务配置错误：', error.message);
    console.error('请检查 .env 文件中的 EMAIL_USER 和 EMAIL_PASS 配置');
    process.exit(1);
  }

  console.log('');
  console.log('📧 发送测试邮件...');

  // 生成验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('📧 验证码：', code);

  // 邮件内容
  const mailOptions = {
    from: `"求职助手" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // 发送到自己的邮箱（测试用）
    subject: '【求职助手】邮件发送测试',
    text: `这是一封测试邮件。您的验证码是：${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">邮件发送测试</h2>
        <p>您好！</p>
        <p>这是一封测试邮件，用于验证邮件发送功能是否正常工作。</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #1890ff; letter-spacing: 5px;">${code}</span>
        </div>
        <p style="color: #666;">如果您收到此邮件，说明邮件发送功能配置正确！</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `
  };

  // 发送邮件
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 邮件发送成功！');
    console.log('📧 邮件ID：', info.messageId);
    console.log('📧 收件人：', process.env.EMAIL_USER);
    console.log('');
    console.log('🎉 测试完成！请检查您的邮箱是否收到测试邮件。');
    console.log('如果未收到，请检查垃圾邮件文件夹。');
  } catch (error) {
    console.error('❌ 邮件发送失败：', error.message);
    console.error('详细错误：', error);
    process.exit(1);
  }
}

// 运行测试
testEmail();
