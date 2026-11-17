require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { sendOTPEmail } = require('./mailer'); // นำเข้าสคริปต์เสริมส่งอีเมล

const app = express();
app.use(cors());
app.use(express.json());

// ตั้งค่า Gemini AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// เก็บข้อมูล OTP และผู้ใช้งานชั่วคราว
const otpStore = new Map();
const usersStore = new Map();

// 1. API ส่งรหัส OTP (เรียกใช้ผ่านสคริปต์เสริม)
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลให้ถูกต้อง' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // หมดอายุใน 10 นาที

    otpStore.set(email, { otp, expiresAt });

    try {
        await sendOTPEmail(email, otp);
        res.json({ message: 'ส่งรหัส OTP ไปยังอีเมลของคุณเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ error: 'ไม่สามารถส่งอีเมล OTP ได้ กรุณาตรวจสอบการตั้งค่าระบบอีเมล' });
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
        return res.status(400).json({ error: 'รหัส OTP หมดอายุแล้ว' });
    }
    if (record.otp !== otp) {
        return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง' });
    }

    res.json({ success: true, message: 'ยืนยัน OTP สำเร็จ!' });
});

// 3. API สมัครสมาชิก
app.post('/api/register', (req, res) => {
    const { email, username, password, consent1, consent2 } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if (password.length < 8 || password.length > 12) {
        return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาว 8 ถึง 12 หลัก' });
    }
    if (!consent1 || !consent2) {
        return res.status(400).json({ error: 'กรุณากดยินยอมเงื่อนไขทั้ง 2 ข้อ' });
    }

    usersStore.set(email, { username, password });
    otpStore.delete(email);

    res.json({ success: true, username });
});

// 4. API แชทกับ Script AI
app.post('/api/chat', async (req, res) => {
    try {
        const { message, confirmed } = req.body;
        if (!message) return res.status(400).json({ error: 'กรุณาส่งข้อความ' });

        const systemInstruction = `คุณคือ "Script AI" ผู้ช่วยเขียนโค้ดระดับสูง เชี่ยวชาญ Lua, Luau, Python, JavaScript และอื่นๆ 
หากผู้ใช้สั่งให้สร้างสคริปต์ และ confirmed เป็น false: ห้ามสร้างโค้ดเต็ม ให้ถามความต้องการและจบด้วยประโยคบังคับว่า: "คุณต้องการให้เริ่มทำหรือสร้างเลยหรือไม่?"
หาก confirmed เป็น true: ให้เขียนโค้ดฉบับสมบูรณ์ทันที`;

        const promptContent = confirmed ? `[ผู้ใช้กดยืนยันให้เริ่มสร้างแล้ว] คำสั่งเดิม: ${message}` : message;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: promptContent,
            config: { systemInstruction }
        });

        const reply = response.text || "ขออภัย ไม่สามารถประมวลผลได้ในขณะนี้";
        const askConfirmation = !confirmed && reply.includes("คุณต้องการให้เริ่มทำหรือสร้างเลยหรือไม่");

        res.json({ reply, askConfirmation });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการติดต่อกับ AI' });
    }
});

// เสิร์ฟหน้าเว็บ Frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`SCRIPT AI OS running on port ${PORT}`);
});
    
