let currentEmail = '';
let lastUserPrompt = '';

// ตรวจสอบสถานะการล็อกอินเมื่อเปิดเว็บ
window.onload = () => {
    const savedUser = localStorage.getItem('script_ai_user');
    if (savedUser) {
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('mainPlatform').classList.remove('hidden');
        document.getElementById('displayUser').textContent = `👤 ${savedUser}`;
    }
    loadSavedTheme();
};

function showError(msg) {
    document.getElementById('authError').textContent = msg;
}

// 1. ส่งรหัส OTP
async function sendOTP() {
    const email = document.getElementById('regEmail').value.trim();
    if (!email || !email.includes('@')) {
        return showError('กรุณากรอกอีเมลให้ถูกต้องก่อนดำเนินการ');
    }

    showError('กำลังส่งรหัส OTP ไปยังอีเมลของคุณ...');
    try {
        const res = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (res.ok) {
            currentEmail = email;
            showError('');
            document.getElementById('stepEmail').classList.add('hidden');
            document.getElementById('stepOtp').classList.remove('hidden');
            document.getElementById('regOtp').focus();
        } else {
            showError(data.error);
        }
    } catch (err) {
        showError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อส่ง OTP ได้');
    }
}

// 2. ตรวจสอบ OTP อัตโนมัติเมื่อกรอกครบ 6 หลัก
function autoCheckOTP() {
    const otpVal = document.getElementById('regOtp').value.trim();
    if (otpVal.length === 6) {
        verifyOTP();
    }
}

async function verifyOTP() {
    const otp = document.getElementById('regOtp').value.trim();
    if (otp.length !== 6) {
        return showError('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
    }

    try {
        const res = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail, otp })
        });
        const data = await res.json();

        if (res.ok) {
            showError('');
            document.getElementById('stepOtp').classList.add('hidden');
            document.getElementById('stepDetails').classList.remove('hidden');
        } else {
            showError(data.error);
        }
    } catch (err) {
        showError('เกิดข้อผิดพลาดในการตรวจสอบ OTP');
    }
}

// 3. ยืนยันข้อมูลการสมัครสมาชิกทั้งหมด
async function completeRegistration() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const consent1 = document.getElementById('consent1').checked;
    const consent2 = document.getElementById('consent2').checked;

    if (!username) return showError('กรุณากรอกชื่อผู้ใช้');
    if (password.length < 8 || password.length > 12) {
        return showError('รหัสผ่านต้องมีความยาว 8 ถึง 12 หลักเท่านั้น');
    }
    if (password !== confirmPassword) {
        return showError('รหัสผ่านทั้ง 2 ช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
    }
    if (!consent1 || !consent2) {
        return showError('กรุณากดยอมรับเงื่อนไขทั้ง 2 ข้อก่อนเข้าใช้งาน');
    }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail, username, password, consent1, consent2 })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('script_ai_user', username);
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('loadingScreen').classList.remove('hidden');

            // จำลองการโหลดแพลตฟอร์ม 2.5 วินาที แล้วเปิดหน้าใช้งาน
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
                document.getElementById('mainPlatform').classList.remove('hidden');
                document.getElementById('displayUser').textContent = `👤 ${username}`;
            }, 2500);
        } else {
            showError(data.error);
        }
    } catch (err) {
        showError('ไม่สามารถบันทึกข้อมูลสมาชิกได้');
    }
}

// 4. ระบบแชทและการกดยืนยันสร้างสคริปต์
function handleEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

async function sendMessage(isConfirmed = false) {
    const inputField = document.getElementById('userInput');
    const messageText = isConfirmed ? lastUserPrompt : inputField.value.trim();

    if (!messageText) return;

    if (!isConfirmed) {
        lastUserPrompt = messageText;
        appendMessage(messageText, 'user-message');
        inputField.value = '';
    } else {
        appendMessage('✅ ยืนยัน: เริ่มสร้างสคริปต์ได้เลย!', 'user-message');
    }

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageText, confirmed: isConfirmed })
        });

        const data = await response.json();

        if (response.ok) {
            appendMessage(data.reply, 'ai-message', data.askConfirmation);
        } else {
            appendMessage('⚠️ ' + (data.error || 'เกิดข้อผิดพลาดในการติดต่อ AI'), 'ai-message');
        }
    } catch (error) {
        appendMessage('⚠️ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ในขณะนี้', 'ai-message');
    }
}

function appendMessage(text, className, showConfirmBtn = false) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = className === 'user-message' ? '👤' : '🤖';

    const content = document.createElement('div');
    content.className = 'content';
    content.textContent = text;

    // หาก AI ถามยืนยัน ให้สร้างปุ่มกดเริ่มสร้างอัตโนมัติ
    if (showConfirmBtn) {
        const btnWrap = document.createElement('div');
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'confirm-action-btn';
        confirmBtn.textContent = '🚀 เริ่มสร้างทันที';
        confirmBtn.onclick = () => {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'กำลังสร้าง...';
            sendMessage(true);
        };
        btnWrap.appendChild(confirmBtn);
        content.appendChild(btnWrap);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 5. ระบบตั้งค่าเปลี่ยนสีหน้าเว็บ
function toggleThemePanel() {
    document.getElementById('themePanel').classList.toggle('hidden');
}

function updateTheme() {
    const accent = document.getElementById('accentColorPicker').value;
    const bg = document.getElementById('bgColorPicker').value;
    const surface = document.getElementById('surfaceColorPicker').value;
    const text = document.getElementById('textColorPicker').value;

    document.documentElement.style.setProperty('--accent-color', accent);
    document.documentElement.style.setProperty('--bg-color', bg);
    document.documentElement.style.setProperty('--surface-color', surface);
    document.documentElement.style.setProperty('--text-color', text);

    localStorage.setItem('script_ai_theme', JSON.stringify({ accent, bg, surface, text }));
}

function loadSavedTheme() {
    const saved = localStorage.getItem('script_ai_theme');
    if (saved) {
        const { accent, bg, surface, text } = JSON.parse(saved);
        document.getElementById('accentColorPicker').value = accent;
        document.getElementById('bgColorPicker').value = bg;
        document.getElementById('surfaceColorPicker').value = surface;
        document.getElementById('textColorPicker').value = text;
        updateTheme();
    }
}

function resetTheme() {
    localStorage.removeItem('script_ai_theme');
    document.getElementById('accentColorPicker').value = '#38bdf8';
    document.getElementById('bgColorPicker').value = '#0b0f19';
    document.getElementById('surfaceColorPicker').value = '#111827';
    document.getElementById('textColorPicker').value = '#e2e8f0';
    updateTheme();
                                       }
