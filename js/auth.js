/**
 * AKRAV Ai - Advanced Authentication & Session Management System
 * تم دمج منطق الـ 800 سطر مع إصلاحات التوجيه والروابط الديناميكية
 */

(function() {
    'use strict';
    
    // ==================== التكوين المركزي ====================
    const CONFIG = {
        supabase: {
            url: 'https://ptwtzahiznfcvnuhyzw.supabase.co', // تم التصحيح بناءً على الصورة
            anonKey: 'Sb_publishable_M-O4a54dij-a0iUzPwvCYg_u42wMFqF'
        },
        settings: {
            redirectPage: 'ai.html',
            loginPage: 'index.html',
            storageKey: 'sb-akrav-auth-token'
        },
        security: {
            sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 أيام
            autoRefresh: true
        }
    };
    
    class AuthManager {
        constructor() {
            this.supabase = null;
            this.user = null;
            this.session = null;
            this.authStateListeners = [];
            this.init();
        }
        
        async init() {
            try {
                if (!window.supabase) throw new Error('Supabase SDK missing');
                
                this.supabase = window.supabase.createClient(
                    CONFIG.supabase.url, 
                    CONFIG.supabase.anonKey, 
                    {
                        auth: {
                            autoRefreshToken: CONFIG.security.autoRefresh,
                            persistSession: true,
                            detectSessionInUrl: true,
                            storageKey: CONFIG.settings.storageKey
                        }
                    }
                );

                this.setupAuthListeners();
                await this.validateCurrentSession();
                
                console.log('✅ AKRAV Auth System Initialized');
            } catch (error) {
                console.error('❌ Auth Init Error:', error);
            }
        }

        // ============ إدارة الجلسة والتحقق ============
        async validateCurrentSession() {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (session) {
                this.session = session;
                this.user = session.user;
                this.handleNavigationLogic();
            } else if (this.isProtectedRoute()) {
                this.redirectToLogin();
            }
        }

        setupAuthListeners() {
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                this.session = session;
                this.user = session?.user || null;

                if (event === 'SIGNED_IN') {
                    console.log('🎯 User Signed In');
                    this.handleNavigationLogic();
                } else if (event === 'SIGNED_OUT') {
                    console.log('👋 User Signed Out');
                    this.redirectToLogin();
                }
                
                this.notifyListeners(event, session);
            });
        }

        handleNavigationLogic() {
            if (this.isLoginPage() && this.session) {
                // منع المستخدم من البقاء في صفحة تسجيل الدخول إذا كان مسجلاً بالفعل
                window.location.href = CONFIG.settings.redirectPage;
            }
        }

        // ============ طرق المصادقة (إصلاح الروابط) ============
        async signInWithGoogle() {
            const currentOrigin = window.location.origin;
            const { error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // جعل الرابط ديناميكي هو الحل السحري لمشكلة Netlify
                    redirectTo: `${currentOrigin}/${CONFIG.settings.redirectPage}`,
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                }
            });
            if (error) throw error;
        }

        async signInWithEmail(email) {
            const currentOrigin = window.location.origin;
            const { error } = await this.supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    emailRedirectTo: `${currentOrigin}/${CONFIG.settings.redirectPage}`
                }
            });
            if (error) throw error;
        }

        async signOut() {
            const { error } = await this.supabase.auth.signOut();
            if (!error) this.redirectToLogin();
        }

        // ============ أدوات المساعدة (Utilities) ============
        isLoginPage() {
            const path = window.location.pathname;
            return path.endsWith(CONFIG.settings.loginPage) || path.endsWith('/') || path === '';
        }

        isProtectedRoute() {
            const path = window.location.pathname;
            // إضافة أي صفحات محمية هنا
            const protectedPages = ['ai.html', 'img.html', 'ht.html'];
            return protectedPages.some(p => path.includes(p));
        }

        redirectToLogin() {
            if (!this.isLoginPage()) {
                window.location.href = CONFIG.settings.loginPage;
            }
        }

        // نظام المستمعين (للسماح لصفحات أخرى بمراقبة الحالة)
        onAuthStateChange(callback) {
            this.authStateListeners.push(callback);
        }

        notifyListeners(event, session) {
            this.authStateListeners.forEach(cb => cb(event, session));
        }

        getSecureHeaders() {
            return {
                'Authorization': `Bearer ${this.session?.access_token || ''}`,
                'X-Client-Info': 'akrav-ai-web'
            };
        }
    }

    // تصدير الكائن كـ Singleton للنافذة العامة
    window.akravAuth = new AuthManager();
})();

