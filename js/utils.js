// js/utils.js - دوال مساعدة مشتركة
(function() {
    'use strict';
    
    class Utils {
        constructor() {
            this.init();
        }
        
        init() {
            console.log('🚀 تهيئة أدوات AKRAV...');
            this.addGlobalStyles();
            this.setupGlobalFunctions();
        }
        
        addGlobalStyles() {
            const style = document.createElement('style');
            style.textContent = `
                /* أنماط الإشعارات */
                .akrav-notification {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%) translateY(-100px);
                    padding: 12px 24px;
                    border-radius: 10px;
                    z-index: 10000;
                    transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    max-width: 90%;
                    text-align: center;
                }
                
                .akrav-notification.success {
                    background: linear-gradient(135deg, #c5a059, #b08c46);
                    color: white;
                }
                
                .akrav-notification.error {
                    background: linear-gradient(135deg, #ff4444, #cc3333);
                    color: white;
                }
                
                .akrav-notification.warning {
                    background: linear-gradient(135deg, #ff9800, #f57c00);
                    color: white;
                }
                
                .akrav-notification.info {
                    background: linear-gradient(135deg, #2196F3, #1976D2);
                    color: white;
                }
                
                /* أنماط التحميل */
                .akrav-loader {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(197, 160, 89, 0.1);
                    border-top-color: #c5a059;
                    border-radius: 50%;
                    animation: akrav-spin 1s linear infinite;
                }
                
                @keyframes akrav-spin {
                    to { transform: rotate(360deg); }
                }
                
                @keyframes akrav-fade-in {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .akrav-fade-in {
                    animation: akrav-fade-in 0.3s ease-out;
                }
                
                /* أنماط الأزرار */
                .akrav-btn {
                    padding: 12px 24px;
                    border-radius: 10px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                
                .akrav-btn-primary {
                    background: linear-gradient(135deg, #c5a059, #b08c46);
                    color: white;
                }
                
                .akrav-btn-primary:hover {
                    background: linear-gradient(135deg, #b08c46, #a0783e);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(197, 160, 89, 0.3);
                }
                
                .akrav-btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: #f0f0f0;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .akrav-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }
                
                .akrav-btn-danger {
                    background: linear-gradient(135deg, #ff4444, #cc3333);
                    color: white;
                }
                
                .akrav-btn-danger:hover {
                    background: linear-gradient(135deg, #ff5555, #dd4444);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255, 68, 68, 0.3);
                }
            `;
            document.head.appendChild(style);
        }
        
        setupGlobalFunctions() {
            // تعريض الدوال للوصول العام
            window.showNotification = this.showNotification.bind(this);
            window.validateEmail = this.validateEmail.bind(this);
            window.copyToClipboard = this.copyToClipboard.bind(this);
            window.showLoading = this.showLoading.bind(this);
            window.hideLoading = this.hideLoading.bind(this);
            window.openSecureWindow = this.openSecureWindow.bind(this);
            window.downloadFile = this.downloadFile.bind(this);
            window.downloadImage = this.downloadImage.bind(this);
            window.formatDate = this.formatDate.bind(this);
            window.truncateText = this.truncateText.bind(this);
        }
        
        // ============== دوال الإشعارات ==============
        
        showNotification(message, type = 'success', duration = 3000) {
            // إزالة الإشعارات القديمة
            const oldNotifications = document.querySelectorAll('.akrav-notification');
            oldNotifications.forEach(n => n.remove());
            
            const notification = document.createElement('div');
            notification.className = `akrav-notification ${type}`;
            notification.innerHTML = `
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            // عرض الإشعار
            setTimeout(() => {
                notification.style.transform = 'translateX(-50%) translateY(0)';
            }, 10);
            
            // إخفاء الإشعار بعد المدة المحددة
            setTimeout(() => {
                notification.style.transform = 'translateX(-50%) translateY(-100px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 500);
            }, duration);
            
            return notification;
        }
        
        getNotificationIcon(type) {
            switch(type) {
                case 'success': return 'fa-check-circle';
                case 'error': return 'fa-exclamation-circle';
                case 'warning': return 'fa-exclamation-triangle';
                case 'info': return 'fa-info-circle';
                default: return 'fa-bell';
            }
        }
        
        // ============== دوال التحميل ==============
        
        showLoading(text = 'جاري التحميل...') {
            let loadingOverlay = document.getElementById('akrav-loading-overlay');
            
            if (!loadingOverlay) {
                loadingOverlay = document.createElement('div');
                loadingOverlay.id = 'akrav-loading-overlay';
                loadingOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(10, 10, 10, 0.95);
                    backdrop-filter: blur(10px);
                    z-index: 9998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 20px;
                `;
                
                loadingOverlay.innerHTML = `
                    <div class="akrav-loader"></div>
                    <div style="color: #c5a059; font-weight: 600; font-size: 16px;">${text}</div>
                `;
                
                document.body.appendChild(loadingOverlay);
            } else {
                loadingOverlay.style.display = 'flex';
                const textElement = loadingOverlay.querySelector('div:last-child');
                if (textElement) {
                    textElement.textContent = text;
                }
            }
            
            return loadingOverlay;
        }
        
        hideLoading() {
            const loadingOverlay = document.getElementById('akrav-loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                loadingOverlay.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (loadingOverlay.parentNode) {
                        loadingOverlay.style.display = 'none';
                        loadingOverlay.style.opacity = '1';
                    }
                }, 300);
            }
        }
        
        // ============== دوال التحقق ==============
        
        validateEmail(email) {
            if (!email || typeof email !== 'string') return false;
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email.trim());
        }
        
        validateURL(url) {
            try {
                new URL(url);
                return true;
            } catch (error) {
                return false;
            }
        }
        
        // ============== دوال النسخ ==============
        
        async copyToClipboard(text) {
            if (!text) {
                this.showNotification('لا يوجد نص للنسخ', 'error');
                return false;
            }
            
            try {
                await navigator.clipboard.writeText(text);
                this.showNotification('تم النسخ إلى الحافظة', 'success');
                return true;
            } catch (err) {
                console.warn('⚠️ فشل النسخ بالطريقة الحديثة، جرب الطريقة القديمة:', err);
                
                // طريقة احتياطية
                try {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    const success = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    if (success) {
                        this.showNotification('تم النسخ إلى الحافظة', 'success');
                        return true;
                    } else {
                        throw new Error('فشل النسخ');
                    }
                } catch (backupErr) {
                    console.error('❌ فشل النسخ بالطريقة القديمة:', backupErr);
                    this.showNotification('فشل نسخ النص', 'error');
                    return false;
                }
            }
        }
        
        // ============== دوال النوافذ ==============
        
        openSecureWindow(url, title = '_blank', features = 'noopener,noreferrer') {
            try {
                if (!url) {
                    this.showNotification('لا يوجد رابط لفتحه', 'error');
                    return null;
                }
                
                const newWindow = window.open(url, title, features);
                
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    this.showNotification('تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة.', 'warning');
                    return null;
                }
                
                return newWindow;
            } catch (error) {
                console.error('❌ خطأ في فتح النافذة:', error);
                this.showNotification('حدث خطأ في فتح النافذة', 'error');
                return null;
            }
        }
        
        // ============== دوال التنزيل ==============
        
        async downloadFile(content, filename, type = 'text/plain') {
            try {
                const blob = new Blob([content], { type: type });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                
                document.body.appendChild(a);
                a.click();
                
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                
                this.showNotification(`بدأ تنزيل الملف: ${filename}`, 'success');
                return true;
            } catch (error) {
                console.error('❌ خطأ في تنزيل الملف:', error);
                this.showNotification('فشل تنزيل الملف', 'error');
                return false;
            }
        }
        
        async downloadImage(imageUrl, filename = null) {
            try {
                if (!imageUrl) {
                    this.showNotification('لا يوجد رابط للصورة', 'error');
                    return false;
                }
                
                if (!filename) {
                    filename = `AKRAV_Image_${Date.now()}.jpg`;
                }
                
                // محاولة باستخدام fetch
                const response = await fetch(imageUrl, { mode: 'cors' });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.style.display = 'none';
                    
                    document.body.appendChild(a);
                    a.click();
                    
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                    
                    this.showNotification('تم تنزيل الصورة بنجاح', 'success');
                    return true;
                } else {
                    throw new Error('فشل جلب الصورة');
                }
            } catch (error) {
                console.error('❌ خطأ في تنزيل الصورة:', error);
                
                // طريقة احتياطية
                try {
                    const a = document.createElement('a');
                    a.href = imageUrl;
                    a.download = filename || `AKRAV_Image_${Date.now()}.jpg`;
                    a.style.display = 'none';
                    
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                    }, 100);
                    
                    this.showNotification('بدأ تنزيل الصورة (طريقة احتياطية)', 'warning');
                    return true;
                } catch (fallbackError) {
                    console.error('❌ فشل الطريقة الاحتياطية:', fallbackError);
                    this.showNotification('فشل تنزيل الصورة', 'error');
                    return false;
                }
            }
        }
        
        // ============== دوال تنسيق البيانات ==============
        
        formatDate(date, format = 'ar-SA') {
            try {
                const d = new Date(date);
                
                if (format === 'ar-SA') {
                    return d.toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else if (format === 'short') {
                    return d.toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } else if (format === 'time') {
                    return d.toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else {
                    return d.toLocaleDateString();
                }
            } catch (error) {
                console.error('❌ خطأ في تنسيق التاريخ:', error);
                return date;
            }
        }
        
        formatFileSize(bytes) {
            if (bytes === 0) return '0 بايت';
            
            const k = 1024;
            const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        truncateText(text, length = 50, suffix = '...') {
            if (!text || typeof text !== 'string') return '';
            
            if (text.length <= length) return text;
            
            return text.substring(0, length) + suffix;
        }
        
        escapeHTML(text) {
            if (!text) return '';
            
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
        
        // ============== دوال المصفوفات والكائنات ==============
        
        deepClone(obj) {
            return JSON.parse(JSON.stringify(obj));
        }
        
        mergeObjects(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    this.mergeObjects(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        }
        
        // ============== دوال التخزين الآمن ==============
        
        secureSetSession(key, value) {
            try {
                const encrypted = btoa(encodeURIComponent(JSON.stringify({
                    data: value,
                    timestamp: Date.now(),
                    hash: this.generateHash(value)
                })));
                sessionStorage.setItem(`akrav_${key}`, encrypted);
                return true;
            } catch (error) {
                console.error('❌ خطأ في تخزين البيانات:', error);
                return false;
            }
        }
        
        secureGetSession(key) {
            try {
                const encrypted = sessionStorage.getItem(`akrav_${key}`);
                if (!encrypted) return null;
                
                const decoded = JSON.parse(decodeURIComponent(atob(encrypted)));
                
                // التحقق من التجزئة
                if (decoded.hash !== this.generateHash(decoded.data)) {
                    console.warn('⚠️ بيانات التخزين تم العبث بها');
                    sessionStorage.removeItem(`akrav_${key}`);
                    return null;
                }
                
                return decoded.data;
            } catch (error) {
                console.error('❌ خطأ في قراءة البيانات:', error);
                sessionStorage.removeItem(`akrav_${key}`);
                return null;
            }
        }
        
        secureRemoveSession(key) {
            sessionStorage.removeItem(`akrav_${key}`);
        }
        
        clearAllSession() {
            const keys = Object.keys(sessionStorage);
            keys.forEach(key => {
                if (key.startsWith('akrav_')) {
                    sessionStorage.removeItem(key);
                }
            });
        }
        
        generateHash(data) {
            const str = JSON.stringify(data);
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString(36);
        }
        
        // ============== دوال النظام ==============
        
        getDeviceInfo() {
            return {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                isMobile: /Mobi|Android/i.test(navigator.userAgent),
                isTablet: /Tablet|iPad/i.test(navigator.userAgent),
                isDesktop: !/Mobi|Android|Tablet|iPad/i.test(navigator.userAgent)
            };
        }
        
        isOnline() {
            return navigator.onLine;
        }
        
        // ============== دوال DOM مساعدة ==============
        
        createElement(tag, attributes = {}, children = []) {
            const element = document.createElement(tag);
            
            // إضافة السمات
            for (const [key, value] of Object.entries(attributes)) {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else if (key.startsWith('on')) {
                    element.addEventListener(key.substring(2).toLowerCase(), value);
                } else {
                    element.setAttribute(key, value);
                }
            }
            
            // إضافة العناصر الفرعية
            if (Array.isArray(children)) {
                children.forEach(child => {
                    if (child instanceof Node) {
                        element.appendChild(child);
                    } else if (typeof child === 'string') {
                        element.appendChild(document.createTextNode(child));
                    }
                });
            }
            
            return element;
        }
        
        removeElement(element) {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
        
        toggleElementVisibility(element, show) {
            if (element) {
                element.style.display = show ? '' : 'none';
            }
        }
        
        // ============== دوال فحص الأداء ==============
        
        measurePerformance(callback, name = 'Operation') {
            const startTime = performance.now();
            const result = callback();
            const endTime = performance.now();
            
            console.log(`⏱️ ${name}: ${(endTime - startTime).toFixed(2)}ms`);
            return result;
        }
        
        // ============== دوال العشوائية ==============
        
        generateId(length = 8) {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }
        
        generateSessionId() {
            return `sess_${Date.now()}_${this.generateId(6)}`;
        }
        
        // ============== تهيئة الفئة ==============
        
        toString() {
            return 'AKRAV Utils - نظام الأدوات المساعدة';
        }
    }
    
    // إنشاء وتصدير نسخة عالمية
    if (!window.akravUtils) {
        window.akravUtils = new Utils();
        console.log('✅ تم تهيئة أدوات AKRAV بنجاح');
    }
    
    // إضافة مستمع لأحداث الشبكة
    window.addEventListener('online', () => {
        window.akravUtils.showNotification('تم استعادة الاتصال بالإنترنت', 'success');
    });
    
    window.addEventListener('offline', () => {
        window.akravUtils.showNotification('فقدت الاتصال بالإنترنت', 'warning');
    });
    
})();