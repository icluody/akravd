// scripts.js - دوال مساعدة مشتركة
// هذا الملف يمكن تضمينه في جميع الصفحات

// دالة لعرض الإشعارات
function showNotification(text, type = 'success') {
    // التحقق من وجود إشعار سابق وإزالته
    const oldNotification = document.querySelector('.akrav-notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'akrav-notification';
    
    // تحديد اللون حسب النوع
    let backgroundColor = 'rgba(197, 160, 89, 0.9)'; // ذهبي
    if (type === 'error') {
        backgroundColor = 'rgba(255, 68, 68, 0.9)'; // أحمر
    } else if (type === 'warning') {
        backgroundColor = 'rgba(255, 193, 7, 0.9)'; // أصفر
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: ${backgroundColor};
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        z-index: 10000;
        transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        text-align: center;
        max-width: 90%;
        word-break: break-word;
    `;
    
    notification.textContent = text;
    document.body.appendChild(notification);
    
    // عرض الإشعار
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // إخفاء الإشعار بعد 3 ثوانٍ
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 500);
    }, 3000);
    
    return notification;
}

// دالة للتحقق من البريد الإلكتروني
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// دالة للتشفير البسيط (لاستخدامات غير حساسة)
function simpleEncode(str) {
    return btoa(encodeURIComponent(str));
}

// دالة لفك التشفير البسيط
function simpleDecode(str) {
    return decodeURIComponent(atob(str));
}

// دالة لتنزيل الملفات
function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// دالة لنسخ النص للحافظة
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // طريقة احتياطية
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
    }
}

// دالة لتحميل الصورة مع معالجة الأخطاء
function loadImageWithFallback(imgElement, url, fallbackUrl = '') {
    return new Promise((resolve, reject) => {
        imgElement.onload = () => resolve(true);
        imgElement.onerror = () => {
            if (fallbackUrl) {
                imgElement.src = fallbackUrl;
                imgElement.onerror = () => reject(false);
            } else {
                reject(false);
            }
        };
        imgElement.src = url;
    });
}

// تصدير الدوال للنافذة
window.akravUtils = {
    showNotification,
    validateEmail,
    simpleEncode,
    simpleDecode,
    downloadFile,
    copyToClipboard,
    loadImageWithFallback
};