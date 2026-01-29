/**
 * AKRAV Ai - Advanced Authentication System
 * تم إصلاح ربط الأزرار وإصلاح مشكلة حلقة إعادة التوجيه
 */

(function() {
    'use strict';
    
    const CONFIG = {
        supabase: {
            url: 'https://ptwtzahiznfcvnuhyzw.supabase.co',
            anonKey: 'Sb_publishable_M-O4a54dij-a0iUzPwvCYg_u42wMFqF'
        },
        settings: {
            appPage: 'ai.html',
            loginPage: 'index.html',
            storageKey: 'sb-akrav-auth-token'
        }
    };
    
    class AuthManager {
        constructor() {
            this.supabase = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey, {
                auth: {
                    persistSession: true,
                    detectSessionInUrl: true,
                    storageKey: CONFIG.settings.storageKey
                }
            });
            this.init();
        }
        
        async init() {
            // مراقبة حالة المصادقة
            this.supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && this.isLoginPage()) {
                    window.location.href = CONFIG.settings.appPage;
                }
                if (event === 'SIGNED_OUT' && !this.isLoginPage()) {
                    window.location.href = CONFIG.settings.loginPage;
                }
            });

            // التحقق من الجلسة الحالية عند التحميل
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session && this.isLoginPage()) {
                window.location.href = CONFIG.settings.appPage;
            }

            // ربط الأزرار فور تحميل الـ DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.bindUI());
            } else {
                this.bindUI();
            }
        }

        // هذه الدالة هي المسؤولة عن جعل الأزرار تتفاعل مرة أخرى
        bindUI() {
            const googleBtn = document.getElementById('google-login-btn');
            const emailBtn = document.getElementById('email-login-btn');
            const emailInput = document.getElementById('email-input');

            if (googleBtn) {
                googleBtn.onclick = async () => {
                    try {
                        await this.signInWithGoogle();
                    } catch (err) {
                        this.showError('فشل تسجيل الدخول عبر Google');
                    }
                };
            }

            if (emailBtn && emailInput) {
                emailBtn.onclick = async () => {
                    const email = emailInput.value.trim();
                    if (!email) return this.showError('يرجى إدخال البريد الإلكتروني');
                    try {
                        await this.signInWithEmail(email);
                        alert('تفقد بريدك الإلكتروني للحصول على رابط الدخول');
                    } catch (err) {
                        this.showError('فشل إرسال الرابط');
                    }
                };
            }
        }

        async signInWithGoogle() {
            const { error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/${CONFIG.settings.appPage}`
                }
            });
            if (error) throw error;
        }

        async signInWithEmail(email) {
            const { error } = await this.supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/${CONFIG.settings.appPage}`
                }
            });
            if (error) throw error;
        }

        isLoginPage() {
            const path = window.location.pathname;
            return path.endsWith(CONFIG.settings.loginPage) || path.endsWith('/') || path === '';
        }

        showError(msg) {
            const errorText = document.getElementById('error-text');
            const errorDiv = document.getElementById('error-message');
            if (errorDiv && errorText) {
                errorText.innerText = msg;
                errorDiv.style.display = 'flex';
                setTimeout(() => errorDiv.style.display = 'none', 3000);
            } else {
                alert(msg);
            }
        }
    }

    // تهيئة النظام
    window.akravAuth = new AuthManager();
})();
