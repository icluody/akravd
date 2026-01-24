// update-index.js - تحديثات للمصادقة في index.html
// يُضاف هذا الملف قبل </body> في index.html

<script>
// تكوين Supabase
const supabase = window.supabase.createClient(
    'https://ptwteahlznfcvvnuhyzw.supabase.co',
    'Sb_publishable_M-O4a54dij-a0iUzPwvCYg_u42wMFqF'
);

// منطق التوجيه الهجين
function getRedirectUrl() {
    // إذا كان البروتوكول file:// (تطبيق محلي)
    if (window.location.protocol === 'file:') {
        return 'io.supabase.akray://login-callback';
    }
    // إذا كان على Netlify
    return 'https://akrav.netlify.app';
}

// تسجيل الدخول عبر Google
async function handleGoogleLogin() {
    try {
        const redirectTo = getRedirectUrl();
        
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        
        if (error) throw error;
    } catch (error) {
        console.error('خطأ تسجيل دخول Google:', error.message);
        showNotification('فشل تسجيل الدخول عبر Google. حاول مرة أخرى.', 'error');
    }
}

// تسجيل الدخول عبر البريد الإلكتروني (OTP)
async function handleEmailOTP(email) {
    if (!email || !validateEmail(email)) {
        showNotification('يرجى إدخال بريد إلكتروني صحيح', 'warning');
        return;
    }
    
    try {
        const redirectTo = getRedirectUrl();
        
        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                emailRedirectTo: redirectTo
            }
        });
        
        if (error) throw error;
        
        showNotification('تم إرسال رابط تسجيل الدخول إلى بريدك الإلكتروني');
    } catch (error) {
        console.error('خطأ OTP:', error.message);
        showNotification('فشل إرسال رابط تسجيل الدخول. حاول مرة أخرى.', 'error');
    }
}

// التحقق من وجود جلسة سابقة
async function checkExistingSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            // المستخدم مسجل دخول بالفعل، إعادة التوجيه لـ ai.html
            window.location.href = 'ai.html';
        }
    } catch (error) {
        console.error('خطأ التحقق من الجلسة:', error);
    }
}

// معالجة استدعاء OAuth
async function handleOAuthCallback() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('خطأ استدعاء OAuth:', error);
            return;
        }
        
        if (session) {
            // تسجيل دخول ناجح، إعادة التوجيه للدردشة الرئيسية
            window.location.href = 'ai.html';
        }
    } catch (error) {
        console.error('خطأ معالجة الاستدعاء:', error);
    }
}

// عرض نافذة المصادقة
function showAuthModal() {
    // التحقق من وجود نافذة مصادقة سابقة
    if (document.getElementById('auth-overlay')) {
        return;
    }
    
    // إنشاء طبقة التغطية
    const modal = document.createElement('div');
    modal.id = 'auth-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.97);
        backdrop-filter: blur(20px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    // إضافة رسوم متحركة
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // محتوى نافذة المصادقة
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a1a, #222222);
            padding: 40px;
            border-radius: 20px;
            border: 2px solid rgba(197, 160, 89, 0.3);
            max-width: 420px;
            width: 90%;
            text-align: center;
            animation: slideUp 0.4s ease 0.1s both;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        ">
            <div style="margin-bottom: 30px;">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    border: 2px solid rgba(197, 160, 89, 0.4);
                    box-shadow: 0 10px 30px rgba(197, 160, 89, 0.2);
                ">
                    <i class="fas fa-skull" style="font-size: 36px; color: #c5a059;"></i>
                </div>
                <h2 style="color: #c5a059; margin-bottom: 10px; font-size: 24px; font-weight: 700;">AKRAV Ai</h2>
                <p style="color: #aaa; margin-bottom: 30px; line-height: 1.6;">تسجيل الدخول للوصول إلى الذكاء الاصطناعي المتقدم</p>
            </div>
            
            <button id="google-login-btn" style="
                background: #4285F4;
                color: white;
                border: none;
                padding: 16px;
                border-radius: 12px;
                width: 100%;
                margin-bottom: 15px;
                cursor: pointer;
                font-weight: bold;
                font-size: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                transition: all 0.3s;
            ">
                <i class="fab fa-google"></i>
                تسجيل الدخول عبر Google
            </button>
            
            <div style="color: #666; margin: 25px 0; position: relative;">
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1);">
                <span style="background: #1a1a1a; padding: 0 15px; position: absolute; top: -10px; left: 50%; transform: translateX(-50%);">
                    أو
                </span>
            </div>
            
            <div style="margin-bottom: 25px;">
                <input type="email" id="auth-email" placeholder="البريد الإلكتروني" style="
                    width: 100%;
                    padding: 16px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(197, 160, 89, 0.2);
                    border-radius: 12px;
                    color: white;
                    margin-bottom: 15px;
                    font-size: 15px;
                    outline: none;
                    transition: border 0.3s;
                ">
                <button id="email-otp-btn" style="
                    background: rgba(197, 160, 89, 0.9);
                    color: white;
                    border: none;
                    padding: 16px;
                    border-radius: 12px;
                    width: 100%;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 15px;
                    transition: all 0.3s;
                ">
                    إرسال رابط تسجيل الدخول
                </button>
            </div>
            
            <p style="color: #888; font-size: 13px; margin-bottom: 20px; line-height: 1.5;">
                بضغطك على "تسجيل الدخول"، فأنت توافق على شروط الاستخدام وسياسة الخصوصية.
            </p>
            
            <button id="close-auth" style="
                color: #999;
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 10px;
                font-size: 14px;
                transition: color 0.3s;
            ">
                <i class="fas fa-times"></i> إلغاء
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // ربط الأحداث
    const googleBtn = document.getElementById('google-login-btn');
    const emailBtn = document.getElementById('email-otp-btn');
    const closeBtn = document.getElementById('close-auth');
    const emailInput = document.getElementById('auth-email');
    
    // تأثيرات hover
    googleBtn.onmouseenter = () => googleBtn.style.opacity = '0.9';
    googleBtn.onmouseleave = () => googleBtn.style.opacity = '1';
    emailBtn.onmouseenter = () => emailBtn.style.opacity = '0.9';
    emailBtn.onmouseleave = () => emailBtn.style.opacity = '1';
    emailInput.onfocus = () => emailInput.style.borderColor = '#c5a059';
    emailInput.onblur = () => emailInput.style.borderColor = 'rgba(197, 160, 89, 0.2)';
    
    // معالجات الأحداث
    googleBtn.addEventListener('click', handleGoogleLogin);
    emailBtn.addEventListener('click', () => {
        const email = emailInput.value;
        handleEmailOTP(email);
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    });
    
    // إغلاق بالضغط على ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('auth-overlay')) {
            closeBtn.click();
        }
    });
    
    // تركيز على حقل البريد الإلكتروني
    setTimeout(() => emailInput.focus(), 100);
}

// التهيئة عند تحميل DOM
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من الجلسة الحالية
    checkExistingSession();
    
    // التحقق من استدعاء OAuth في الرابط
    const hash = window.location.hash;
    if (hash.includes('access_token') || hash.includes('error')) {
        handleOAuthCallback();
    }
    
    // إضافة زر تسجيل الدخول للواجهة الحالية
    setTimeout(() => {
        // البحث عن عناصر القائمة لإضافة خيار تسجيل الدخول
        const header = document.querySelector('header');
        if (header) {
            // إنشاء زر تسجيل الدخول
            const loginBtn = document.createElement('button');
            loginBtn.className = 'tool-btn';
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span class="hidden md:inline">تسجيل الدخول</span>';
            loginBtn.style.marginRight = '10px';
            loginBtn.onclick = showAuthModal;
            
            // إضافته للرأس
            header.querySelector('.flex.items-center.gap-3').prepend(loginBtn);
        }
    }, 1000);
});

// إظهار نافذة المصادقة تلقائياً بعد 3 ثوانٍ
setTimeout(() => {
    if (!window.location.hash.includes('access_token')) {
        showAuthModal();
    }
}, 3000);
</script>
