const pages = [...document.querySelectorAll(".page")];
const titles = {overview:"ภาพรวม",terminal:"Terminal",devices:"อุปกรณ์จำลอง",security:"Security Lab",editor:"Code Editor"};
function showPage(name){pages.forEach(p=>p.classList.toggle("active-page",p.id===name));document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===name));document.getElementById("page-title").textContent=titles[name]||"ภาพรวม";}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.goto)));

const termOut=document.getElementById("term-output");
const termForm=document.getElementById("term-form");
const termInput=document.getElementById("term-input");
const commands={
 help:"คำสั่งที่รองรับ:\n help                 แสดงคำสั่ง\n lab status           ดูสถานะแล็บ\n device list          แสดงอุปกรณ์จำลอง\n network inspect      ดูข้อมูลเครือข่ายตัวอย่าง\n security audit       แสดงรายการตรวจสอบตัวอย่าง\n clear                ล้างหน้าจอ",
 "lab status":"สถานะ: พร้อมใช้งาน\nโหมด: SIMULATION ONLY\nการเชื่อมต่ออุปกรณ์จริง: ปิดใช้งานใน V1",
 "device list":"Android Lab 01   192.0.2.10   DEMO ONLINE\nWindows Lab 02   192.0.2.20   DEMO ONLINE\nLinux Lab 03     192.0.2.30   DEMO OFFLINE",
 "network inspect":"Lab Network: 192.0.2.0/24 (เอกสารตัวอย่าง)\nจำลองโหนด: 3\nสถานะ: ไม่มีการสแกนเครือข่ายจริง",
 "security audit":"ตัวอย่างรายการตรวจสอบ:\n[PASS] ตรวจสอบการตั้งค่า MFA\n[INFO] ทบทวนสิทธิ์ผู้ใช้\n[INFO] ตรวจสอบการเก็บ API secrets\nผลนี้เป็นข้อมูลสาธิต ไม่ใช่ผลสแกนจริง"
};
termForm.addEventListener("submit",e=>{e.preventDefault();const cmd=termInput.value.trim();if(!cmd)return;termOut.textContent += `\nlab@cyber:~$ ${cmd}\n`;if(cmd==="clear"){termOut.textContent="";}else{termOut.textContent += (commands[cmd]||"ไม่รู้จักคำสั่งนี้ พิมพ์ help เพื่อดูคำสั่งที่รองรับ")+"\n";}termInput.value="";termOut.scrollTop=termOut.scrollHeight;});

document.getElementById("save-code").addEventListener("click",()=>{const lang=document.getElementById("language").value;const ext={JavaScript:"js",Python:"py",Lua:"lua",Luau:"luau",Rust:"rs",Go:"go",HTML:"html",CSS:"css"}[lang]||"txt";const blob=new Blob([document.getElementById("code-area").value],{type:"text/plain"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`cyber-lab-code.${ext}`;a.click();URL.revokeObjectURL(a.href);});

const launcher=document.getElementById("assistant-launcher"),assistant=document.getElementById("assistant");
launcher.addEventListener("click",()=>assistant.classList.toggle("open"));
document.getElementById("close-assistant").addEventListener("click",()=>assistant.classList.remove("open"));
const chatForm=document.getElementById("chat-form"),chatInput=document.getElementById("chat-input"),messages=document.getElementById("chat-messages"),sendBtn=document.getElementById("send-chat");
const history=[];
function addBubble(text,role="ai",extra=""){const el=document.createElement("div");el.className=`bubble ${role} ${extra}`;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el;}
chatForm.addEventListener("submit",async e=>{e.preventDefault();const message=chatInput.value.trim();if(!message)return;addBubble(message,"user");chatInput.value="";chatInput.disabled=true;sendBtn.disabled=true;const pending=addBubble("กำลังส่งคำถามให้ Gemini...","ai");
try{const response=await fetch("/api/assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,history})});const data=await response.json();pending.remove();if(!response.ok){addBubble(data.error+(data.help?`\n${data.help}`:""),"ai","error");}else{addBubble(data.answer||"ไม่ได้รับข้อความตอบกลับ","ai");history.push({role:"user",text:message},{role:"model",text:data.answer||""});if(history.length>12)history.splice(0,2);}}
catch(_){pending.remove();addBubble("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตและลองอีกครั้ง","ai","error");}
finally{chatInput.disabled=false;sendBtn.disabled=false;chatInput.focus();}});
