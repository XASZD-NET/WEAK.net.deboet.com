require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// ตรวจสอบและกำหนดค่า Gemini API โดยใช้ SDK ล่าสุด
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Endpoint สำหรับรับข้อความแชทจาก Frontend
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'กรุณาส่งข้อความ (message) มาใน request body' });
        }

        // เรียกใช้งาน Gemini API ตามรูปแบบ SDK ล่าสุด
        const response = await ai.models.generateContent({
            model: modelName,
            contents: message,
        });

        // ส่งคำตอบกลับไปยัง Frontend
        const reply = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "ขออภัยครับ ไม่สามารถประมวลผลคำตอบได้ในขณะนี้";

        res.json({ reply });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ 
            error: 'เกิดข้อผิดพลาดในการประมวลผล', 
            details: error.message 
        });
    }
});

// เสิร์ฟไฟล์ static จากโฟลเดอร์ frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// จัดการเส้นทางทั้งหมดให้โหลดหน้าเว็บ index.html (ใช้ /.*/ แบบที่รันผ่าน)
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`CYBER LAB OS running on port ${PORT}`);
});
