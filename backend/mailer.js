require('dotenv').config();
const nodemailer = require('nodemailer');

// ตั้งค่าตัวส่งอีเมล (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ฟังก์ชันสำหรับส่งอีเมล OTP
async function sendOTPEmail(toEmail, otpCode) {
    const mailOptions = {
        from: `"Script AI Security" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'รหัสยืนยัน OTP สำหรับเข้าใช้งาน Script AI',
        html: `
            <div style="font-family: sans-serif; background: #0b0f19; color: #fff; padding: 25px; border-radius: 10px;">
                <h2 style="color: #38bdf8;">⚡ ยืนยันตัวตนเข้าใช้งาน Script AI</h2>
                <p>รหัส OTP 6 หลักของคุณคือ:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #22c55e; margin: 15px 0;">
                    ${otpCode}
                </div>
                <p style="color: #9ca3af; font-size: 14px;">* รหัสนี้จะหมดอายุภายใน 10 นาที</p>
                <hr style="border-color: #1f2937; margin: 20px 0;">
                <div style="background: #1f2937; padding: 15px; border-left: 4px solid #ef4444; font-size: 13px; color: #fca5a5;">
                    <strong>⚠️ คำเตือนด้านกฎหมายและทรัพย์สินทางอิเล็กทรอนิกส์:</strong><br>
                    ห้ามคัดลอก ดัดแปลง หรือนำโค้ดและระบบของเว็บไซต์ Script AI ไปใช้งานโดยไม่ได้รับอนุญาต 
                    หากฝ่าฝืนจะดำเนินการตามกฎหมายธุรกิจและกฎหมายอาชญากรรมทางอิเล็กทรอนิกส์อย่างถึงที่สุด (มีโทษจำคุกตั้งแต่ 10 ปีขึ้นไป หรือทั้งจำทั้งปรับ)
                </div>
            </div>
        `
    };

    // ถ้ายังไม่ได้ตั้งค่าอีเมลใน Environment ให้รันในโหมดทดสอบ
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[TEST MODE] OTP สำหรับ ${toEmail} คือ: ${otpCode}`);
        return { success: true, mode: 'test' };
    }

    await transporter.sendMail(mailOptions);
    return { success: true, mode: 'live' };
}

module.exports = { sendOTPEmail };
