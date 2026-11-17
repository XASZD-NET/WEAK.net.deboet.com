require("dotenv").config();
const express = require("express");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 10000;
app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "CYBER LAB OS", version: "1.0.0", mode: "simulation" });
});

app.post("/api/assistant", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
  if (!message) return res.status(400).json({ error: "กรุณาพิมพ์คำถามก่อนส่ง" });
  if (message.length > 5000) return res.status(413).json({ error: "ข้อความยาวเกินไป (สูงสุด 5,000 ตัวอักษร)" });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: "ยังไม่ได้ตั้งค่า Gemini API Key",
      help: "เพิ่ม GEMINI_API_KEY ใน Environment ของ Render แล้ว Deploy ใหม่ หรือใส่ในไฟล์ .env เมื่อลองรันในเครื่อง"
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      systemInstruction: `คุณคือ Gemini Assistant ผู้ช่วยแนะนำการใช้งาน CYBER LAB OS ตอบภาษาเดียวกับผู้ใช้เป็นหลัก อธิบายเป็นขั้นตอน เข้าใจง่าย และถามข้อมูลเพิ่มเมื่อจำเป็น
CYBER LAB OS V1 เป็นห้องทดลองเพื่อการศึกษา โหมดอุปกรณ์และเครือข่ายในรุ่นนี้เป็นข้อมูลจำลองเท่านั้น ห้ามอ้างว่าได้เชื่อมต่อหรือควบคุมอุปกรณ์จริงแล้ว
ให้ช่วยเรื่องการเรียนรู้ การตรวจสอบโค้ด การแก้ไขช่องโหว่ การป้องกัน และการทดสอบในระบบที่ผู้ใช้มีสิทธิ์เท่านั้น ห้ามให้ขั้นตอนสำหรับการบุกรุก ยึดครอง ซ่อนตัว หลบเลี่ยงการตรวจจับ หรือเข้าควบคุมอุปกรณ์/บัญชี/เครือข่ายของผู้อื่นโดยไม่ได้รับอนุญาต หากคำขอเสี่ยง ให้เปลี่ยนเป็นคำแนะนำเชิงป้องกันหรือการจำลองในแล็บ
อย่าเปิดเผย API key หรือความลับ และอย่าอ้างว่าดำเนินการบนเครื่องของผู้ใช้แล้ว`,
    });
    const chat = model.startChat({
      history: history.filter(x => x && ["user", "model"].includes(x.role) && typeof x.text === "string")
        .map(x => ({ role: x.role, parts: [{ text: x.text.slice(0, 3000) }] }))
    });
    const result = await chat.sendMessage(message);
    res.json({ answer: result.response.text() });
  } catch (err) {
    console.error("Gemini request failed:", err.message);
    res.status(502).json({ error: "Gemini ยังตอบคำถามไม่ได้ในขณะนี้ กรุณาลองอีกครั้ง", detail: "ตรวจสอบ API Key, ชื่อโมเดล และโควตาการใช้งานใน Render" });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "..", "frontend", "index.html")));
app.listen(PORT, () => console.log(`CYBER LAB OS running on port ${PORT}`));
