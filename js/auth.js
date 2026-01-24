// js/auth.js - نظام المصادقة المركزي مع Supabase
(function() {
    'use strict';
    
    // ==================== التكوين ====================
    const CONFIG = {
        supabase: {
            url: 'https://ptwteahlznfcvvnuhyzw.supabase.co',
            anonKey: 'Sb_publishable_M-O4a54dij-a0iUzPwvCYg_u42wMFqF'
        },
        oauth: {
            googleClientId: '1090332840742-qis7idmrt6g7f18un1q0p72b0ofov288.apps.googleusercontent.com',
            redirectUrls: {
                web: 'https://akrav.netlify.app',
                mobile: 'io.supabase.akray://login-callback'
            }
        },
        storage: {
            sessionKey: 'sb-akrav-auth-token',
            userKey: 'akrav-user-data',
            settingsKey: 'akrav-user-settings'
        },
        security: {
            sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 أيام
            autoRefresh: true,
            requireAuth: true
        }
    };
    
    // ==================== الفئة الرئيسية ====================
    class AuthManager {
        constructor() {
            this.supabase = null;
            this.user = null;
            this.session = null;
            this.isAuthenticated = false;
            this.isInitialized = false;
            this.authStateListeners = [];
            this.userData = {};
            
            this.init();
        }
        
        // ============ التهيئة ============
        async init() {
            try {
                console.log('🔐 تهيئة نظام المصادقة...');
                
                // التحقق من وجود مكتبة Supabase
                if (!window.supabase) {
                    console.error('❌ مكتبة Supabase غير محملة');
                    this.showAuthError('مكتبة المصادقة غير متوفرة');
                    return;
                }
                
                // إنشاء عميل Supabase
                this.supabase = window.supabase.createClient(
                    CONFIG.supabase.url,
                    CONFIG.supabase.anonKey,
                    {
                        auth: {
                            autoRefreshToken: CONFIG.security.autoRefresh,
                            persistSession: true,
                            detectSessionInUrl: true,
                            storage: window.localStorage,
                            storageKey: CONFIG.storage.sessionKey
                        },
                        global: {
                            headers: {
                                'X-Client-Info': 'akrav-ai-web'
                            }
                        }
                    }
                );
                
                // إخفاء أي وميض للمحتوى
                this.hideContentUntilAuth();
                
                // التحقق من الجلسة الحالية
                await this.checkCurrentSession();
                
                // إعداد مستمع لتغيرات المصادقة
                this.setupAuthListeners();
                
                // إعداد مستمع لانتهاء الجلسة
                this.setupSessionTimeout();
                
                this.isInitialized = true;
                console.log('✅ تم تهيئة نظام المصادقة بنجاح');
                
            } catch (error) {
                console.error('❌ فشل تهيئة نظام المصادقة:', error);
                this.showAuthError('فشل تحميل نظام المصادقة');
            }
        }
        
        // ============ التحقق من الجلسة ============
        async checkCurrentSession() {
            try {
                console.log('🔍 التحقق من الجلسة الحالية...');
                
                const { data: { session }, error } = await this.supabase.auth.getSession();
                
                if (error) {
                    throw new Error(`خطأ في الجلسة: ${error.message}`);
                }
                
                if (session) {
                    console.log('🎯 جلسة موجودة، التحقق من المستخدم...');
                    await this.validateAndSetSession(session);
                } else {
                    console.log('⚠️ لا توجد جلسة نشطة');
                    this.handleNoSession();
                }
                
            } catch (error) {
                console.error('❌ خطأ في التحقق من الجلسة:', error);
                this.handleNoSession();
            }
        }
        
        async validateAndSetSession(session) {
            try {
                // التحقق من انتهاء صلاحية الجلسة
                const now = Date.now();
                const sessionAge = now - new Date(session.created_at).getTime();
                
                if (sessionAge > CONFIG.security.sessionTimeout) {
                    console.log('⏰ انتهت صلاحية الجلسة');
                    await this.supabase.auth.signOut();
                    this.handleNoSession();
                    return;
                }
                
                // الحصول على بيانات المستخدم
                const { data: { user }, error } = await this.supabase.auth.getUser();
                
                if (error || !user) {
                    throw new Error('فشل الحصول على بيانات المستخدم');
                }
                
                // تعيين بيانات المستخدم
                this.session = session;
                this.user = user;
                this.isAuthenticated = true;
                
                // تخزين في النافذة للوصول العام
                window.akravUser = user;
                window.akravSession = session;
                
                // تحميل بيانات المستخدم الإضافية
                await this.loadUserData();
                
                // إظهار المحتوى
                this.showContent();
                
                // تنبيه المستمعين
                this.notifyAuthStateChange('SIGNED_IN', session);
                
                console.log(`✅ تم تسجيل دخول: ${user.email}`);
                
            } catch (error) {
                console.error('❌ خطأ في التحقق من الجلسة:', error);
                this.handleNoSession();
            }
        }
        
        // ============ إدارة الجلسة ============
        handleNoSession() {
            this.user = null;
            this.session = null;
            this.isAuthenticated = false;
            
            window.akravUser = null;
            window.akravSession = null;
            
            // إعادة التوجيه إذا لزم الأمر
            if (CONFIG.security.requireAuth && !this.isLoginPage()) {
                this.redirectToLogin();
            } else {
                this.showContent();
            }
            
            this.notifyAuthStateChange('SIGNED_OUT', null);
        }
        
        setupSessionTimeout() {
            // التحقق من انتهاء الجلسة كل دقيقة
            setInterval(async () => {
                if (this.session) {
                    const now = Date.now();
                    const sessionAge = now - new Date(this.session.created_at).getTime();
                    
                    if (sessionAge > CONFIG.security.sessionTimeout) {
                        console.log('⏰ جلسة منتهية الصلاحية، تسجيل خروج...');
                        await this.signOut();
                    }
                }
            }, 60000); // كل دقيقة
        }
        
        // ============ مستمعو المصادقة ============
        setupAuthListeners() {
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log(`🔐 تغيير حالة المصادقة: ${event}`);
                
                switch (event) {
                    case 'SIGNED_IN':
                        this.handleSignIn(session);
                        break;
                        
                    case 'SIGNED_OUT':
                        this.handleSignOut();
                        break;
                        
                    case 'TOKEN_REFRESHED':
                        this.handleTokenRefreshed(session);
                        break;
                        
                    case 'USER_UPDATED':
                        this.handleUserUpdated(session);
                        break;
                        
                    case 'PASSWORD_RECOVERY':
                        this.handlePasswordRecovery(session);
                        break;
                }
                
                this.notifyAuthStateChange(event, session);
            });
        }
        
        handleSignIn(session) {
            this.supabase.auth.getUser().then(({ data: { user } }) => {
                this.session = session;
                this.user = user;
                this.isAuthenticated = true;
                
                window.akravUser = user;
                window.akravSession = session;
                
                // إذا كنا في صفحة تسجيل الدخول، أعد التوجيه
                if (this.isLoginPage()) {
                    setTimeout(() => {
                        window.location.href = 'ai.html';
                    }, 1000);
                }
                
                this.showNotification(`مرحباً ${user.email}`, 'success');
            });
        }
        
        handleSignOut() {
            this.user = null;
            this.session = null;
            this.isAuthenticated = false;
            
            window.akravUser = null;
            window.akravSession = null;
            
            // تنظيف التخزين
            this.clearStorage();
            
            // إعادة التوجيه لصفحة تسجيل الدخول
            if (!this.isLoginPage()) {
                this.redirectToLogin();
            }
            
            this.showNotification('تم تسجيل الخروج بنجاح', 'info');
        }
        
        handleTokenRefreshed(session) {
            this.session = session;
            console.log('🔄 تم تحديث رمز المصادقة');
        }
        
        handleUserUpdated(session) {
            this.session = session;
            console.log('👤 تم تحديث بيانات المستخدم');
        }
        
        handlePasswordRecovery(session) {
            console.log('🔐 طلب استعادة كلمة المرور');
        }
        
        // ============ طرق المصادقة ============
        async signInWithGoogle() {
            try {
                this.showLoading('جاري تسجيل الدخول عبر Google...');
                
                const redirectTo = this.getRedirectUrl();
                
                const { error } = await this.supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectTo,
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent'
                        },
                        scopes: 'email profile'
                    }
                });
                
                if (error) throw error;
                
            } catch (error) {
                console.error('❌ خطأ في تسجيل الدخول عبر Google:', error);
                this.showNotification('فشل تسجيل الدخول عبر Google', 'error');
                throw error;
            } finally {
                this.hideLoading();
            }
        }
        
        async signInWithEmail(email) {
            try {
                if (!email || !email.includes('@')) {
                    throw new Error('بريد إلكتروني غير صالح');
                }
                
                this.showLoading('جاري إرسال رابط التسجيل...');
                
                const redirectTo = this.getRedirectUrl();
                
                const { error } = await this.supabase.auth.signInWithOtp({
                    email: email.trim(),
                    options: {
                        emailRedirectTo: redirectTo,
                        shouldCreateUser: true
                    }
                });
                
                if (error) throw error;
                
                this.showNotification('تم إرسال رابط التسجيل إلى بريدك الإلكتروني', 'success');
                
            } catch (error) {
                console.error('❌ خطأ في تسجيل الدخول بالبريد:', error);
                this.showNotification('فشل إرسال رابط التسجيل', 'error');
                throw error;
            } finally {
                this.hideLoading();
            }
        }
        
        async signUp(email, password) {
            try {
                this.showLoading('جاري إنشاء الحساب...');
                
                const { data, error } = await this.supabase.auth.signUp({
                    email: email.trim(),
                    password: password,
                    options: {
                        emailRedirectTo: this.getRedirectUrl()
                    }
                });
                
                if (error) throw error;
                
                this.showNotification('تم إنشاء الحساب بنجاح، يرجى التحقق من بريدك', 'success');
                return data;
                
            } catch (error) {
                console.error('❌ خطأ في إنشاء الحساب:', error);
                this.showNotification('فشل إنشاء الحساب', 'error');
                throw error;
            } finally {
                this.hideLoading();
            }
        }
        
        async signOut() {
            try {
                this.showLoading('جاري تسجيل الخروج...');
                
                const { error } = await this.supabase.auth.signOut();
                
                if (error) throw error;
                
                this.handleSignOut();
                
            } catch (error) {
                console.error('❌ خطأ في تسجيل الخروج:', error);
                this.showNotification('فشل تسجيل الخروج', 'error');
                throw error;
            } finally {
                this.hideLoading();
            }
        }
        
        async updateProfile(updates) {
            try {
                if (!this.user) throw new Error('يجب تسجيل الدخول أولاً');
                
                const { data, error } = await this.supabase.auth.updateUser(updates);
                
                if (error) throw error;
                
                this.user = data.user;
                window.akravUser = data.user;
                
                this.showNotification('تم تحديث الملف الشخصي', 'success');
                return data;
                
            } catch (error) {
                console.error('❌ خطأ في تحديث الملف:', error);
                this.showNotification('فشل تحديث الملف الشخصي', 'error');
                throw error;
            }
        }
        
        // ============ إدارة بيانات المستخدم ============
        async loadUserData() {
            try {
                if (!this.user) return;
                
                // تحميل البيانات المحفوظة
                const savedData = localStorage.getItem(CONFIG.storage.userKey);
                if (savedData) {
                    this.userData = JSON.parse(savedData);
                }
                
                // جلب البيانات من Supabase إذا لزم الأمر
                // يمكنك إضافة جلب بيانات إضافية هنا
                
            } catch (error) {
                console.error('❌ خطأ في تحميل بيانات المستخدم:', error);
            }
        }
        
        async saveUserData() {
            try {
                if (!this.user) return;
                
                localStorage.setItem(
                    CONFIG.storage.userKey,
                    JSON.stringify(this.userData)
                );
                
            } catch (error) {
                console.error('❤️ خطأ في حفظ بيانات المستخدم:', error);
            }
        }
        
        clearStorage() {
            try {
                localStorage.removeItem(CONFIG.storage.sessionKey);
                localStorage.removeItem(CONFIG.storage.userKey);
                localStorage.removeItem(CONFIG.storage.settingsKey);
                
                sessionStorage.clear();
                
            } catch (error) {
                console.error('❌ خطأ في تنظيف التخزين:', error);
            }
        }
        
        // ============ أدوات التحكم في الواجهة ============
        hideContentUntilAuth() {
            // إخفاء المحتوى حتى التحقق من المصادقة
            if (!this.isLoginPage() && CONFIG.security.requireAuth) {
                document.documentElement.style.display = 'none';
                
                // إضافة شاشة التحميل
                const loadingScreen = document.createElement('div');
                loadingScreen.id = 'auth-loading-screen';
                loadingScreen.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #0a0a0a;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 20px;
                `;
                
                loadingScreen.innerHTML = `
                    <div style="width: 60px; height: 60px; border: 4px solid rgba(197, 160, 89, 0.1); border-top-color: #c5a059; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div style="color: #c5a059; font-weight: 600; font-size: 16px;">جاري التحقق من المصادقة...</div>
                    <div style="color: #666; font-size: 14px;">AKRAV Ai - نظام أمني متكامل</div>
                `;
                
                document.body.appendChild(loadingScreen);
                
                // إضافة أنماط الرسوم المتحركة
                const style = document.createElement('style');
                style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
                document.head.appendChild(style);
            }
        }
        
        showContent() {
            // إخفاء شاشة التحميل
            const loadingScreen = document.getElementById('auth-loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (loadingScreen.parentNode) {
                        loadingScreen.remove();
                    }
                }, 300);
            }
            
            // إظهار المحتوى
            document.documentElement.style.display = '';
            
            // إضافة زر تسجيل الخروج إذا لزم الأمر
            if (this.isAuthenticated && !this.isLoginPage()) {
                this.addLogoutButton();
            }
        }
        
        addLogoutButton() {
            // التحقق من وجود الزر مسبقاً
            if (document.getElementById('akrav-logout-btn')) return;
            
            // البحث عن مكان مناسب للزر
            const header = document.querySelector('header');
            if (!header) return;
            
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'akrav-logout-btn';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> تسجيل الخروج';
            logoutBtn.style.cssText = `
                background: rgba(255, 68, 68, 0.1);
                color: #ff6b6b;
                border: 1px solid rgba(255, 68, 68, 0.3);
                padding: 8px 15px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                margin-right: 10px;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            
            logoutBtn.onmouseenter = () => {
                logoutBtn.style.background = 'rgba(255, 68, 68, 0.2)';
                logoutBtn.style.transform = 'translateY(-1px)';
            };
            
            logoutBtn.onmouseleave = () => {
                logoutBtn.style.background = 'rgba(255, 68, 68, 0.1)';
                logoutBtn.style.transform = 'translateY(0)';
            };
            
            logoutBtn.onclick = () => {
                if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                    this.signOut();
                }
            };
            
            // إضافة الزر للهيدر
            const headerContainer = header.querySelector('.flex.items-center.gap-3');
            if (headerContainer) {
                headerContainer.prepend(logoutBtn);
            } else {
                header.appendChild(logoutBtn);
            }
        }
        
        showAuthError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(26, 26, 26, 0.95);
                padding: 30px;
                border-radius: 15px;
                border: 2px solid rgba(255, 68, 68, 0.3);
                text-align: center;
                z-index: 10000;
                max-width: 400px;
                width: 90%;
            `;
            
            errorDiv.innerHTML = `
                <div style="color: #ff4444; font-size: 48px; margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="color: white; margin-bottom: 10px; font-size: 20px;">خطأ في النظام</h3>
                <p style="color: #aaa; margin-bottom: 20px; line-height: 1.5;">${message}</p>
                <button onclick="location.reload()" style="
                    background: #c5a059;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">
                    <i class="fas fa-redo"></i> إعادة تحميل الصفحة
                </button>
            `;
            
            document.body.appendChild(errorDiv);
        }
        
        // ============ أدوات مساعدة ============
        getRedirectUrl() {
            // التوجيه الهجين للتطبيقات المحلية والويب
            if (window.location.protocol === 'file:') {
                return CONFIG.oauth.redirectUrls.mobile;
            }
            return CONFIG.oauth.redirectUrls.web;
        }
        
        isLoginPage() {
            return window.location.pathname.includes('index.html') || 
                   window.location.pathname.endsWith('/');
        }
        
        redirectToLogin() {
            if (!this.isLoginPage()) {
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        }
        
        // ============ نظام المستمعين ============
        onAuthStateChange(callback) {
            this.authStateListeners.push(callback);
            
            // إرجاع دالة لإلغاء الاشتراك
            return () => {
                const index = this.authStateListeners.indexOf(callback);
                if (index > -1) {
                    this.authStateListeners.splice(index, 1);
                }
            };
        }
        
        notifyAuthStateChange(event, session) {
            this.authStateListeners.forEach(callback => {
                try {
                    callback(event, session, this.user);
                } catch (error) {
                    console.error('❌ خطأ في مستمع حالة المصادقة:', error);
                }
            });
        }
        
        // ============ دوال الواجهة ============
        showLoading(text = 'جاري التحميل...') {
            if (window.akravUtils && window.akravUtils.showLoading) {
                window.akravUtils.showLoading(text);
            }
        }
        
        hideLoading() {
            if (window.akravUtils && window.akravUtils.hideLoading) {
                window.akravUtils.hideLoading();
            }
        }
        
        showNotification(message, type = 'info') {
            if (window.akravUtils && window.akravUtils.showNotification) {
                window.akravUtils.showNotification(message, type);
            } else {
                alert(message);
            }
        }
        
        // ============ API عام ============
        getUser() { return this.user; }
        getSession() { return this.session; }
        isLoggedIn() { return this.isAuthenticated; }
        getSupabaseClient() { return this.supabase; }
        getUserData() { return this.userData; }
        updateUserData(key, value) {
            this.userData[key] = value;
            this.saveUserData();
        }
        
        // التحقق من الصلاحية للملفات
        async validateAccess() {
            if (!this.isAuthenticated || !this.session) {
                return false;
            }
            
            try {
                const { data: { user }, error } = await this.supabase.auth.getUser();
                return !error && user && user.id === this.user.id;
            } catch (error) {
                return false;
            }
        }
        
        // إنشاء رؤوس آمنة للطلبات
        getSecureHeaders() {
            return {
                'Authorization': `Bearer ${this.session?.access_token || ''}`,
                'X-User-ID': this.user?.id || '',
                'X-Client': 'akrav-ai-web'
            };
        }
    }
    
    // ==================== التصدير والتهيئة ====================
    
    // التحقق من أن الصفحة ليست ht.html أو img.html (لاحقاً سنحميها)
    const currentPage = window.location.pathname;
    const isProtectedPage = currentPage.includes('ai.html') || 
                           currentPage.includes('img.html') || 
                           currentPage.includes('ht.html');
    
    // إنشاء نسخة عالمية من مدير المصادقة
    if (!window.akravAuth) {
        window.akravAuth = new AuthManager();
        
        // إضافة API عام للوصول السهل
        window.signInWithGoogle = () => window.akravAuth.signInWithGoogle();
        window.signInWithEmail = (email) => window.akravAuth.signInWithEmail(email);
        window.signOut = () => window.akravAuth.signOut();
        
        console.log('✅ نظام المصادقة جاهز للاستخدام');
    }
    
    // تهيئة الأحداث لصفحة index.html
    document.addEventListener('DOMContentLoaded', function() {
        const isIndexPage = window.location.pathname.includes('index.html') || 
                           window.location.pathname.endsWith('/');
        
        if (isIndexPage) {
            setTimeout(() => {
                // ربط أزرار المصادقة
                const googleBtn = document.getElementById('google-login-btn');
                const emailBtn = document.getElementById('email-login-btn');
                const emailInput = document.getElementById('email-input');
                const errorDiv = document.getElementById('error-message');
                const successDiv = document.getElementById('success-message');
                
                if (googleBtn) {
                    googleBtn.addEventListener('click', async () => {
                        try {
                            await window.akravAuth.signInWithGoogle();
                        } catch (error) {
                            if (errorDiv) {
                                errorDiv.style.display = 'flex';
                                document.getElementById('error-text').textContent = 
                                    'فشل تسجيل الدخول عبر Google';
                            }
                        }
                    });
                }
                
                if (emailBtn && emailInput) {
                    emailBtn.addEventListener('click', async () => {
                        const email = emailInput.value.trim();
                        
                        if (!email || !email.includes('@')) {
                            if (errorDiv) {
                                errorDiv.style.display = 'flex';
                                document.getElementById('error-text').textContent = 
                                    'يرجى إدخال بريد إلكتروني صحيح';
                                setTimeout(() => {
                                    errorDiv.style.display = 'none';
                                }, 3000);
                            }
                            return;
                        }
                        
                        try {
                            await window.akravAuth.signInWithEmail(email);
                            
                            if (successDiv) {
                                successDiv.style.display = 'flex';
                                document.getElementById('success-text').textContent = 
                                    'تم إرسال رابط التسجيل إلى بريدك الإلكتروني';
                                setTimeout(() => {
                                    successDiv.style.display = 'none';
                                }, 5000);
                            }
                            
                            emailInput.value = '';
                            
                        } catch (error) {
                            if (errorDiv) {
                                errorDiv.style.display = 'flex';
                                document.getElementById('error-text').textContent = 
                                    'فشل إرسال رابط التسجيل';
                                setTimeout(() => {
                                    errorDiv.style.display = 'none';
                                }, 3000);
                            }
                        }
                    });
                    
                    // السماح بالضغط على Enter
                    emailInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            emailBtn.click();
                        }
                    });
                }
                
                // التحقق من الجلسة الحالية
                setTimeout(() => {
                    if (window.akravAuth && window.akravAuth.isLoggedIn()) {
                        // إذا كان المستخدم مسجل دخول، أعد التوجيه
                        window.location.href = 'ai.html';
                    }
                }, 1000);
                
            }, 500);
        }
    });
    
})();