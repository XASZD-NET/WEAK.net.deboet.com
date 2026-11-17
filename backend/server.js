require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// ตั้งค่า Gemini AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// เก็บข้อมูล OTP และผู้ใช้งานชั่วคราวในหน่วยความจำ (Memory Store)
const otpStore = new Map();
const usersStore = new Map();

// ตั้งค่าตัวส่งอีเมล (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. API ส่งรหัส OTP ไปยังอีเมล
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลให้ถูกต้อง' });
    }

    // สุ่มรหัส OTP 6 หลักไม่ซ้ำกัน
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // หมดอายุภายใน 10 นาที

    otpStore.set(email, { otp, expiresAt });

    const mailOptions = {
        from: `"Script AI Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'รหัสยืนยัน OTP สำหรับเข้าใช้งาน Script AI',
        html: `
            <div style="font-family: sans-serif; background: #0b0f19; color: #fff; padding: 25px; border-radius: 10px;">
                <h2 style="color: #38bdf8;">⚡ ยืนยันตัวตนเข้าใช้งาน Script AI</h2>
                <p>รหัส OTP 6 หลักของคุณคือ:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #22c55e; margin: 15px 0;">
                    ${otp}
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

    try {
        // ถ้ายังไม่ตั้งค่า EMAIL_USER ในเซิร์ฟเวอร์ ให้แสดงรหัสใน Console แทนเพื่อทดสอบ
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log(`[TEST MODE] OTP สำหรับ ${email} คือ: ${otp}`);
            return res.json({ message: 'ส่งรหัส OTP เรียบร้อยแล้ว (โหมดทดสอบ: เช็คที่ Logs)' });
        }

        await transporter.sendMail(mailOptions);
        res.json({ message: 'ส่งรหัส OTP ไปยังอีเมลของคุณเรียบร้อยแล้ว (โปรดตรวจสอบภายใน 1 นาที)' });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ error: 'ไม่สามารถส่งอีเมล OTP ได้ กรุณาตรวจสอบการตั้งค่าอีเมลเซิร์ฟเวอร์' });
    }
});

// 2. API ตรวจสอบรหัส OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore.get(email);

    if (!record) {
        return res.status(400).json({ error: 'ไม่พบข้อมูลการขอ OTP สำหรับอีเมลนี้' });
    }
    if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'รหัส OTP หมดอายุแล้ว กรุณากดขอรหัสใหม่' });
    }
    if (record.otp !== otp) {
        return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง' });
    }

    res.json({ success: true, message: 'ยืนยัน OTP สำเร็จ!' });
});

// 3. API บันทึกการสมัครสมาชิก
app.post('/api/register', (req, res) => {
    const { email, username, password, consent1, consent2 } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' });
    }
    if (password.length < 8 || password.length > 12) {
        return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาว 8 ถึง 12 หลักเท่านั้น' });
    }
    if (!consent1 || !consent2) {
        return res.status(400).json({ error: 'กรุณากดยินยอมเงื่อนไขทั้ง 2 ข้อก่อนดำเนินการต่อ' });
    }

    usersStore.set(email, { username, password });
    otpStore.delete(email); // ลบ OTP ที่ใช้แล้ว

    res.json({ success: true, username });
});

// 4. API แชทกับ Script AI
app.post('/api/chat', async (req, res) => {
    try {
        const { message, confirmed } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'กรุณาส่งข้อความ' });
        }

        // กำหนดบุคลิกและกฎการทำงานของ Script AI
        const systemInstruction = `คุณคือ "Script AI" ผู้ช่วยเขียนโค้ดและพัฒนาสคริปต์ระดับสูง 
กฎการทำงานของคุณ:
1. คุณเชี่ยวชาญการเขียนโค้ดทุกภาษา โดยเฉพาะ Lua, Luau (Roblox), Python, JavaScript, HTML/CSS และสามารถเขียนโค้ดผสมผสานโครงสร้างข้ามภาษาได้อย่างยืดหยุ่น
2. หากผู้ใช้สั่งให้ "สร้าง" หรือ "เขียนสคริปต์" หรือ "ทำระบบ" และสถานะการยืนยัน (confirmed) ยังเป็น false:
   - ห้ามสร้างโค้ดฉบับเต็มทันที!
   - ให้วิเคราะห์ความต้องการ ถามคำถามเพิ่มเติมสั้นๆ เพื่อความชัดเจน และจบประโยคด้วยคำถามบังคับว่า: "คุณต้องการให้เริ่มทำหรือสร้างเลยหรือไม่?"
3. หากสถานะการยืนยัน (confirmed) เป็น true หรือผู้ใช้กดยืนยันให้เริ่มสร้างแล้ว:
   - ให้ลงมือเขียนโค้ดหรือสร้างสคริปต์ฉบับสมบูรณ์อย่างละเอียดและใช้งานได้จริงทันที!`;

        const promptContent = confirmed 
            ? `[ผู้ใช้กดยืนยันให้เริ่มสร้างแล้ว] คำสั่งเดิม: ${message}` 
            : message;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: promptContent,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        const reply = response.text || "ขออภัยครับ ไม่สามารถประมวลผลคำตอบได้ในขณะนี้";
        
        // ตรวจสอบว่า AI กำลังถามคำถามยืนยันขั้นสุดท้ายหรือไม่ เพื่อแสดงปุ่มกดยืนยันบนหน้าเว็บ
        const askConfirmation = !confirmed && reply.includes("คุณต้องการให้เริ่มทำหรือสร้างเลยหรือไม่");

        res.json({ reply, askConfirmation });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการติดต่อกับ AI' });
    }
});

// เสิร์ฟไฟล์หน้าบ้าน (Frontend)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`SCRIPT AI OS running on port ${PORT}`);
});
