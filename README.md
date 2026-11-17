# CYBER LAB OS V1

เว็บแพลตฟอร์มเรียนรู้ Cybersecurity พร้อม Gemini Assistant ที่มุมล่างขวา

## สิ่งที่มีใน V1
- Dashboard แบบ responsive
- Gemini Assistant ผ่าน Backend API
- Terminal Simulator (คำสั่งจำลองแบบ allowlist เท่านั้น)
- Device Manager ที่แสดงอุปกรณ์ตัวอย่าง
- Security Learning modules
- Code Editor เบื้องต้นและดาวน์โหลดไฟล์โค้ด
- Health endpoint: `/api/health`

## ขอบเขตความปลอดภัย
V1 เป็นสภาพแวดล้อมเพื่อการเรียนรู้และจำลองเท่านั้น ไม่มีการสแกน IP จริง ไม่มีการเชื่อมต่อหรือควบคุมอุปกรณ์จริง และไม่มีการรันคำสั่งระบบปฏิบัติการหรือโค้ดที่ผู้ใช้ป้อน Terminal รองรับเฉพาะคำสั่งตัวอย่างที่กำหนดไว้

## รันในเครื่อง
1. ติดตั้ง Node.js 20 ขึ้นไป
2. คัดลอก `.env.example` เป็น `.env`
3. ใส่ Gemini API key ใน `GEMINI_API_KEY`
4. ติดตั้ง dependencies: `npm install`
5. เริ่มระบบ: `npm start`
6. เปิด `http://localhost:10000`

ห้าม commit `.env` หรือเปิดเผย Gemini API key

## Deploy บน Render
1. Push โฟลเดอร์นี้ขึ้น GitHub repository
2. ใน Render เลือก New > Web Service แล้วเชื่อม GitHub repository
3. Build Command: `npm install`
4. Start Command: `npm start`
5. เพิ่ม Environment Variable:
   - `GEMINI_API_KEY` = API key ของคุณ
   - `GEMINI_MODEL` = `gemini-2.5-flash` (เปลี่ยนได้ตามโมเดลที่บัญชีรองรับ)
6. Deploy แล้วทดสอบ `/api/health`

มีไฟล์ `render.yaml` สำหรับ Blueprint deployment ด้วย

## หมายเหตุ
- Render ไม่ได้รัน Windows `.exe` เป็น Web Service โดยตรง
- V1 นี้ยังไม่มี Desktop EXE หรือ Agent เชื่อมต่ออุปกรณ์จริง
- ก่อนเพิ่ม runtime สำหรับรันโค้ด ต้องออกแบบ sandbox แยกสิทธิ์และทรัพยากรอย่างปลอดภัย
