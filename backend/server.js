require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// ตรวจสอบและกำหนดค่า Gemini API โดยใช้ SDK ล่าสุด
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

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

        // ส่งคำตอบกลับไปยัง Frontend (ขึ้นอยู่กับโครงสร้างผลลัพธ์ของ SDK ล่าสุด)
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

// ตรวจสอบสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
    res.send('Cyber Lab OS Backend is running successfully!');
});

const PORT = process.env.PORT || 10000;
app.get(/.*/, (_req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend", "index.html")
  );
});

app.listen(PORT, () => {
  console.log(`CYBER LAB OS running on port ${PORT}`);
});
