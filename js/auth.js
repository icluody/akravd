// js/auth.js — Central Auth System (FULL & FIXED)
(function () {
  'use strict';

  /* ======================= CONFIG ======================= */
  const CONFIG = {
    supabase: {
      url: 'https://ptwteahlznfcvvnuhyzw.supabase.co',
      anonKey: 'Sb_publishable_M-O4a54dij-a0iUzPwvCYg_u42wMFqF'
    },
    urls: {
      login: 'https://akrav-d.netlify.app/index.html',
      home: 'https://akrav-d.netlify.app/ai.html'
    },
    security: {
      requireAuth: true,
      checkInterval: 60_000
    },
    storage: {
      userKey: 'akrav-user-data',
      settingsKey: 'akrav-user-settings'
    }
  };

  /* ======================= HELPERS ======================= */
  const isLoginPage = () => {
    const p = location.pathname;
    return p === '/' || p === '/index.html' || p.endsWith('/index.html');
  };

  const redirect = (url) => {
    window.location.replace(url);
  };

  /* ======================= CLIENT ======================= */
  if (!window.supabase?.createClient) {
    console.error('❌ Supabase SDK not loaded');
    return;
  }

  const supabase = window.supabase.createClient(
    CONFIG.supabase.url,
    CONFIG.supabase.anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    }
  );

  /* ======================= AUTH MANAGER ======================= */
  class AuthManager {
    constructor() {
      this.user = null;
      this.session = null;
      this.authenticated = false;
      this.listeners = [];
      this.init();
    }

    /* ---------- INIT ---------- */
    async init() {
      this.hidePage();
      await this.restoreSession();
      this.bindAuthEvents();
      this.startSessionWatcher();
      this.showPage();
    }

    /* ---------- SESSION ---------- */
    async restoreSession() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) return this.noSession();

      if (session.expires_at && Date.now() >= session.expires_at * 1000) {
        await supabase.auth.signOut();
        return this.noSession();
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return this.noSession();

      this.session = session;
      this.user = userData.user;
      this.authenticated = true;

      window.akravUser = this.user;
      window.akravSession = this.session;

      if (isLoginPage()) redirect(CONFIG.urls.home);
    }

    noSession() {
      this.session = null;
      this.user = null;
      this.authenticated = false;

      window.akravUser = null;
      window.akravSession = null;

      if (CONFIG.security.requireAuth && !isLoginPage()) {
        redirect(CONFIG.urls.login);
      }
    }

    /* ---------- EVENTS ---------- */
    bindAuthEvents() {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          this.session = session;
          this.authenticated = true;
          redirect(CONFIG.urls.home);
        }

        if (event === 'SIGNED_OUT') {
          this.noSession();
        }
      });
    }

    /* ---------- WATCHER ---------- */
    startSessionWatcher() {
      setInterval(async () => {
        if (!this.session) return;
        if (this.session.expires_at * 1000 <= Date.now()) {
          await this.signOut();
        }
      }, CONFIG.security.checkInterval);
    }

    /* ---------- AUTH ACTIONS ---------- */
    async signInWithGoogle() {
      return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: CONFIG.urls.home
        }
      });
    }

    async signInWithEmail(email) {
      return supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: CONFIG.urls.home,
          shouldCreateUser: true
        }
      });
    }

    async signOut() {
      await supabase.auth.signOut();
      this.noSession();
    }

    /* ---------- DATA ---------- */
    loadUserData() {
      try {
        return JSON.parse(localStorage.getItem(CONFIG.storage.userKey)) || {};
      } catch {
        return {};
      }
    }

    saveUserData(data) {
      localStorage.setItem(CONFIG.storage.userKey, JSON.stringify(data));
    }

    /* ---------- UI ---------- */
    hidePage() {
      if (!isLoginPage()) document.documentElement.style.visibility = 'hidden';
    }

    showPage() {
      document.documentElement.style.visibility = '';
    }

    /* ---------- API ---------- */
    isLoggedIn() { return this.authenticated; }
    getUser() { return this.user; }
    getSession() { return this.session; }
    getClient() { return supabase; }
  }

  /* ======================= BOOTSTRAP ======================= */
  window.akravAuth = new AuthManager();
  window.signInWithGoogle = () => window.akravAuth.signInWithGoogle();
  window.signInWithEmail = (e) => window.akravAuth.signInWithEmail(e);
  window.signOut = () => window.akravAuth.signOut();

})();
