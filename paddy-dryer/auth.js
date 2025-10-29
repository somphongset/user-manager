// ========================================
// PADDY DRYER MANAGEMENT SYSTEM
// Authentication & Authorization Module
// ========================================

const Auth = {
  // ========================================
  // CONSTANTS
  // ========================================
  STORAGE_KEY: {
    SESSION: 'paddy_dryer_session',
    ATTEMPTS: 'paddy_dryer_attempts',
    DRAFTS: 'paddy_dryer_drafts',
    LAST_ACTIVITY: 'paddy_dryer_last_activity'
  },

  // ========================================
  // STATE
  // ========================================
  currentSession: null,
  activityTimer: null,

  // ========================================
  // INITIALIZATION
  // ========================================
  init() {
    console.log('🔐 Initializing Auth module...');
    
    // โหลด session ที่มีอยู่
    this.loadSession();
    
    // ตั้งค่า activity monitoring
    this.setupActivityMonitoring();
    
    // เช็ค session timeout
    this.checkSessionTimeout();
    
    console.log('✅ Auth initialized');
  },

  // ========================================
  // LOGIN
  // ========================================
  
  /**
   * ตรวจสอบ PIN และสร้าง session
   * @param {string} pin - PIN 4 หลัก
   * @returns {Object} - { success: boolean, message: string, role?: string }
   */
  login(pin) {
    // เช็คว่าถูก lockout หรือไม่
    if (this.isLockedOut()) {
      const remainingTime = this.getLockoutRemaining();
      return {
        success: false,
        message: APP_CONFIG.formatMessage('tooManyAttempts', { 
          seconds: remainingTime 
        })
      };
    }

    // ค้นหา role ที่ตรงกับ PIN
    const roleConfig = APP_CONFIG.getRoleByPin(pin);

    if (!roleConfig) {
      // PIN ผิด - เพิ่มจำนวนครั้งที่ลองผิด
      this.incrementAttempts();
      
      const attempts = this.getAttempts();
      const remaining = APP_CONFIG.MAX_PIN_ATTEMPTS - attempts;
      
      if (remaining > 0) {
        return {
          success: false,
          message: `${APP_CONFIG.MESSAGES.invalidPin} (เหลือ ${remaining} ครั้ง)`
        };
      } else {
        // ครบจำนวนครั้งที่กำหนด - lockout
        this.lockout();
        return {
          success: false,
          message: APP_CONFIG.formatMessage('tooManyAttempts', { 
            seconds: APP_CONFIG.LOCKOUT_TIME 
          })
        };
      }
    }

    // PIN ถูกต้อง - สร้าง session
    const session = {
      authenticated: true,
      role: roleConfig.role,
      roleName: roleConfig.name,
      roleIcon: roleConfig.icon,
      permissions: roleConfig.permissions,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    // บันทึก session
    this.saveSession(session);
    this.currentSession = session;

    // ล้างจำนวนครั้งที่ลองผิด
    this.clearAttempts();

    console.log('✅ Login success:', roleConfig.role);

    return {
      success: true,
      message: `ยินดีต้อนรับ ${roleConfig.name}`,
      role: roleConfig.role,
      roleName: roleConfig.name,
      permissions: roleConfig.permissions
    };
  },

  // ========================================
  // LOGOUT
  // ========================================
  
  /**
   * ออกจากระบบ
   */
  logout() {
    console.log('👋 Logging out...');
    
    // ลบ session
    localStorage.removeItem(this.STORAGE_KEY.SESSION);
    localStorage.removeItem(this.STORAGE_KEY.DRAFTS);
    localStorage.removeItem(this.STORAGE_KEY.LAST_ACTIVITY);
    
    this.currentSession = null;
    
    // หยุด activity timer
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }
    
    console.log('✅ Logged out');
  },

  // ========================================
  // SESSION MANAGEMENT
  // ========================================
  
  /**
   * บันทึก session ลง localStorage
   */
  saveSession(session) {
    localStorage.setItem(
      this.STORAGE_KEY.SESSION, 
      JSON.stringify(session)
    );
  },

  /**
   * โหลด session จาก localStorage
   */
  loadSession() {
    const data = localStorage.getItem(this.STORAGE_KEY.SESSION);
    
    if (!data) {
      this.currentSession = null;
      return null;
    }

    try {
      const session = JSON.parse(data);
      
      // เช็คว่า session หมดอายุหรือยัง
      if (this.isSessionExpired(session)) {
        console.log('⚠️ Session expired');
        this.logout();
        return null;
      }

      this.currentSession = session;
      console.log('✅ Session loaded:', session.role);
      return session;
      
    } catch (error) {
      console.error('❌ Error loading session:', error);
      this.logout();
      return null;
    }
  },

  /**
   * ดึง session ปัจจุบัน
   */
  getSession() {
    if (!this.currentSession) {
      this.loadSession();
    }
    return this.currentSession;
  },

  /**
   * เช็คว่า session หมดอายุหรือไม่
   */
  isSessionExpired(session) {
    if (!session || !session.loginTime) {
      return true;
    }

    const now = Date.now();
    const loginTime = new Date(session.loginTime).getTime();
    const elapsed = (now - loginTime) / 1000; // seconds

    return elapsed > APP_CONFIG.SESSION_TIMEOUT;
  },

  /**
   * เช็ค session timeout (เรียกทุกครั้งที่โหลดหน้า)
   */
  checkSessionTimeout() {
    const session = this.getSession();
    
    if (session && this.isSessionExpired(session)) {
      alert(APP_CONFIG.MESSAGES.sessionExpired);
      this.logout();
      return false;
    }
    
    return true;
  },

  /**
   * อัพเดทเวลา activity ล่าสุด
   */
  updateActivity() {
    const session = this.getSession();
    
    if (session) {
      session.lastActivity = new Date().toISOString();
      this.saveSession(session);
      localStorage.setItem(
        this.STORAGE_KEY.LAST_ACTIVITY, 
        session.lastActivity
      );
    }
  },

  /**
   * ตั้งค่า activity monitoring
   */
  setupActivityMonitoring() {
    // เช็คทุก 1 นาที
    this.activityTimer = setInterval(() => {
      const session = this.getSession();
      
      if (!session) return;

      const now = Date.now();
      const lastActivity = new Date(session.lastActivity).getTime();
      const inactive = (now - lastActivity) / 1000; // seconds

      // ถ้าไม่ใช้งานเกินกำหนด → logout
      if (inactive > APP_CONFIG.AUTO_LOGOUT_INACTIVE) {
        console.log('⚠️ Auto logout - inactive');
        alert('คุณไม่ได้ใช้งานนานเกินไป ระบบจะ logout อัตโนมัติ');
        this.logout();
        window.location.reload();
      }
    }, 60000); // เช็คทุก 1 นาที

    // ตรวจจับ user activity
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activities.forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, { passive: true });
    });
  },

  // ========================================
  // AUTHENTICATION STATE
  // ========================================
  
  /**
   * เช็คว่า authenticated หรือไม่
   */
  isAuthenticated() {
    const session = this.getSession();
    return session && session.authenticated;
  },

  /**
   * ดึง role ปัจจุบัน
   */
  getRole() {
    const session = this.getSession();
    return session ? session.role : null;
  },

  /**
   * ดึงชื่อ role ปัจจุบัน
   */
  getRoleName() {
    const session = this.getSession();
    return session ? session.roleName : null;
  },

  /**
   * เช็คว่าเป็น role นี้หรือไม่
   */
  isRole(role) {
    const session = this.getSession();
    return session && session.role === role;
  },

  // ========================================
  // PERMISSIONS
  // ========================================
  
  /**
   * เช็คว่ามี permission หรือไม่
   */
  hasPermission(permission) {
    const session = this.getSession();
    
    if (!session || !session.permissions) {
      return false;
    }

    return session.permissions.includes(permission);
  },

  /**
   * เช็ค permissions แบบหลายตัว
   */
  hasAnyPermission(...permissions) {
    return permissions.some(p => this.hasPermission(p));
  },

  /**
   * เช็ค permissions ต้องมีครบทุกตัว
   */
  hasAllPermissions(...permissions) {
    return permissions.every(p => this.hasPermission(p));
  },

  // Permission shortcuts
  canRead() {
    return this.hasPermission('read');
  },

  canCreate() {
    return this.hasPermission('create');
  },

  canUpdate() {
    return this.hasPermission('update');
  },

  canDelete() {
    return this.hasPermission('delete');
  },

  canExport() {
    return this.hasPermission('export');
  },

  isReadOnly() {
    return this.isRole('manager') || !this.hasAnyPermission('create', 'update', 'delete');
  },

  // ========================================
  // BRUTE FORCE PROTECTION
  // ========================================
  
  /**
   * เพิ่มจำนวนครั้งที่ลอง PIN ผิด
   */
  incrementAttempts() {
    const attempts = this.getAttempts() + 1;
    localStorage.setItem(
      this.STORAGE_KEY.ATTEMPTS,
      JSON.stringify({
        count: attempts,
        timestamp: Date.now()
      })
    );
  },

  /**
   * ดึงจำนวนครั้งที่ลอง PIN ผิด
   */
  getAttempts() {
    const data = localStorage.getItem(this.STORAGE_KEY.ATTEMPTS);
    
    if (!data) return 0;

    try {
      const { count, timestamp } = JSON.parse(data);
      
      // ถ้าเกิน 1 ชั่วโมง → reset
      const elapsed = (Date.now() - timestamp) / 1000;
      if (elapsed > 3600) {
        this.clearAttempts();
        return 0;
      }

      return count || 0;
    } catch {
      return 0;
    }
  },

  /**
   * ล้างจำนวนครั้งที่ลองผิด
   */
  clearAttempts() {
    localStorage.removeItem(this.STORAGE_KEY.ATTEMPTS);
  },

  /**
   * Lockout (หลังลองผิดเกิน)
   */
  lockout() {
    localStorage.setItem(
      this.STORAGE_KEY.ATTEMPTS,
      JSON.stringify({
        count: APP_CONFIG.MAX_PIN_ATTEMPTS,
        timestamp: Date.now(),
        lockedUntil: Date.now() + (APP_CONFIG.LOCKOUT_TIME * 1000)
      })
    );
  },

  /**
   * เช็คว่าถูก lockout หรือไม่
   */
  isLockedOut() {
    const data = localStorage.getItem(this.STORAGE_KEY.ATTEMPTS);
    
    if (!data) return false;

    try {
      const { lockedUntil } = JSON.parse(data);
      
      if (!lockedUntil) return false;

      // ถ้าเลยเวลา lockout แล้ว → ปลด lock
      if (Date.now() > lockedUntil) {
        this.clearAttempts();
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * เวลาที่เหลือของการ lockout
   */
  getLockoutRemaining() {
    const data = localStorage.getItem(this.STORAGE_KEY.ATTEMPTS);
    
    if (!data) return 0;

    try {
      const { lockedUntil } = JSON.parse(data);
      
      if (!lockedUntil) return 0;

      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      return remaining;
    } catch {
      return 0;
    }
  },

  // ========================================
  // HELPERS
  // ========================================
  
  /**
   * ดึงข้อมูล user ปัจจุบัน (สำหรับแสดง UI)
   */
  getCurrentUser() {
    const session = this.getSession();
    
    if (!session) return null;

    return {
      role: session.role,
      roleName: session.roleName,
      roleIcon: session.roleIcon,
      permissions: session.permissions,
      loginTime: session.loginTime,
      isReadOnly: this.isReadOnly()
    };
  },

  /**
   * เช็คว่าต้อง login หรือไม่
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      console.log('⚠️ Not authenticated - redirecting to login');
      return false;
    }
    return true;
  },

  /**
   * เช็คว่ามี permission หรือไม่ (พร้อมแจ้งเตือน)
   */
  requirePermission(permission) {
    if (!this.hasPermission(permission)) {
      const actionMap = {
        'create': 'บันทึกข้อมูล',
        'update': 'แก้ไขข้อมูล',
        'delete': 'ลบข้อมูล',
        'export': 'ส่งออกข้อมูล'
      };
      
      const action = actionMap[permission] || permission;
      alert(APP_CONFIG.formatMessage('noPermission', { action }));
      return false;
    }
    return true;
  }
};

// ========================================
// AUTO INITIALIZATION
// ========================================

// เรียกใช้ทันทีเมื่อโหลด script
if (typeof document !== 'undefined') {
  // รอให้ DOM พร้อม
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      Auth.init();
    });
  } else {
    Auth.init();
  }
}

// ========================================
// EXPORT
// ========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}

console.log('✅ Auth module loaded');
