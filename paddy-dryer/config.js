// ========================================
// PADDY DRYER MANAGEMENT SYSTEM
// Configuration File
// ========================================

const APP_CONFIG = {
  // ========================================
  // SUPABASE CONFIGURATION
  // ========================================
  SUPABASE_URL: 'https://enxlewubbskfhonfjllu.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueGxld3ViYnNrZmhvbmZqbGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MzAxNjksImV4cCI6MjA3NzMwNjE2OX0.rEwUaVjOkpI5lcmKaS0h3p6M9jsSL25nU202qHtuVyU',

  // ========================================
  // AUTHENTICATION - PIN CONFIGURATION
  // ========================================
  PINS: {
    // Staff - มีสิทธิ์เต็ม
    'staff': {
      pin: '1234',
      role: 'staff',
      name: 'เจ้าหน้าที่',
      icon: '👤',
      permissions: ['read', 'create', 'update', 'delete'],
      description: 'สามารถบันทึก แก้ไข และลบข้อมูลได้'
    },
    
    // Manager - ดูอย่างเดียว
    'manager': {
      pin: '9999',
      role: 'manager',
      name: 'ผู้จัดการ',
      icon: '👔',
      permissions: ['read', 'export'],
      description: 'ดูข้อมูลและส่งออกรายงานเท่านั้น'
    }
  },

  // ========================================
  // SESSION CONFIGURATION
  // ========================================
  SESSION_TIMEOUT: 8 * 60 * 60,          // 8 ชั่วโมง (วินาที)
  AUTO_LOGOUT_INACTIVE: 30 * 60,         // Auto logout หลังไม่ใช้งาน 30 นาที (วินาที)
  
  // ========================================
  // SECURITY SETTINGS
  // ========================================
  MAX_PIN_ATTEMPTS: 5,                   // จำนวนครั้งที่ลองผิดได้
  LOCKOUT_TIME: 60,                      // delay หลังลองผิดเกิน (วินาที)
  
  // ========================================
  // APPLICATION SETTINGS
  // ========================================
  DRYER_COUNT: 5,                        // จำนวนเครื่องอบ
  AUTO_SAVE_INTERVAL: 30000,             // Auto-save draft ทุก 30 วินาที (มิลลิวินาที)
  
  // กราฟ
  CHART_DEFAULT_RANGE: 'all',            // 'all' | '24h' | '12h'
  CHART_UPDATE_INTERVAL: 60000,          // อัพเดทกราฟทุก 1 นาที (มิลลิวินาที)
  
  // ข้อมูล
  MOISTURE_MIN: 9,                       // ความชื้นต่ำสุด (%)
  MOISTURE_MAX: 35,                      // ความชื้นสูงสุด (%)
  TEMP_MIN: 0,                           // อุณหภูมิต่ำสุด (°C)
  TEMP_MAX: 100,                         // อุณหภูมิสูงสุด (°C)
  
  // ========================================
  // UI SETTINGS
  // ========================================
  LOCALE: 'th-TH',                       // ภาษาไทย
  TIMEZONE: 'Asia/Bangkok',              // เขตเวลาไทย
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
  
  // ========================================
  // REALTIME SETTINGS
  // ========================================
  ENABLE_REALTIME: true,                 // เปิด/ปิด realtime updates
  REALTIME_CHANNEL: 'drying_data',       // ชื่อ channel
  
  // ========================================
  // OFFLINE SETTINGS
  // ========================================
  ENABLE_OFFLINE: true,                  // เปิด/ปิด offline mode
  OFFLINE_STORAGE_LIMIT: 100,            // จำนวนข้อมูลสูงสุดที่เก็บ offline
  
  // ========================================
  // FEATURE FLAGS
  // ========================================
  FEATURES: {
    editHistory: true,                   // เก็บประวัติการแก้ไข
    softDelete: true,                    // ใช้ soft delete
    bulkEntry: true,                     // บันทึกหลายค่าพร้อมกัน
    exportPDF: true,                     // Export เป็น PDF
    exportExcel: true,                   // Export เป็น Excel
    pushNotifications: false,            // Push notifications (ยังไม่เปิด)
    darkMode: false                      // Dark mode (ยังไม่เปิด)
  },
  
  // ========================================
  // STATUS COLORS
  // ========================================
  STATUS_COLORS: {
    available: '#ef4444',      // แดง - ว่าง
    loading: '#eab308',        // เหลือง - กำลังป้อน
    drying: '#22c55e',         // เขียว - กำลังอบ
    unloading: '#3b82f6',      // ฟ้า - กำลังอบออก
    completed: '#9ca3af',      // เทา - เสร็จแล้ว
    cancelled: '#6b7280'       // เทาเข้ม - ยกเลิก
  },
  
  // ========================================
  // STATUS LABELS (ภาษาไทย)
  // ========================================
  STATUS_LABELS: {
    available: 'ว่าง',
    loading: 'กำลังป้อนข้าว',
    drying: 'กำลังอบ',
    unloading: 'กำลังอบออก',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก'
  },
  
  // ========================================
  // VALIDATION MESSAGES
  // ========================================
  MESSAGES: {
    // Authentication
    invalidPin: 'PIN ไม่ถูกต้อง กรุณาลองใหม่',
    tooManyAttempts: 'คุณลอง PIN ผิดหลายครั้ง กรุณารอ {seconds} วินาที',
    sessionExpired: 'เซสชันหมดอายุ กรุณา login ใหม่',
    logoutSuccess: 'ออกจากระบบเรียบร้อย',
    
    // Validation
    moistureOutOfRange: 'ความชื้นต้องอยู่ระหว่าง {min}-{max}%',
    moistureTooLow: 'ความชื้นต่ำมาก ({value}%) กรุณาตรวจสอบอีกครั้ง',
    tempOutOfRange: 'อุณหภูมิต้องอยู่ระหว่าง {min}-{max}°C',
    tempTooHigh: 'อุณหภูมิสูงกว่าปกติ ({value}°C)',
    futureTime: 'ไม่สามารถบันทึกเวลาในอนาคตได้',
    timeBeforeStart: 'เวลาบันทึกต้องหลังจากเริ่มอบ',
    
    // Business rules
    dryerBusy: 'เครื่อง {number} ยังมีงาน {batch_code} ที่ยังไม่เสร็จ',
    cannotEdit: 'ไม่สามารถแก้ไขงานที่เสร็จสิ้นแล้ว',
    noPermission: 'คุณไม่มีสิทธิ์ {action}',
    
    // Success
    saveSuccess: 'บันทึกสำเร็จ',
    deleteSuccess: 'ลบสำเร็จ',
    updateSuccess: 'แก้ไขสำเร็จ',
    
    // Offline
    offlineMode: 'คุณอยู่ในโหมดออฟไลน์ - ข้อมูลจะ sync เมื่อกลับมา online',
    syncSuccess: 'Sync ข้อมูลสำเร็จ ({count} รายการ)',
    syncFailed: 'Sync ข้อมูลล้มเหลว กรุณาลองใหม่'
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

// ดึงข้อมูล role จาก PIN
APP_CONFIG.getRoleByPin = function(pin) {
  const entry = Object.entries(this.PINS).find(
    ([key, config]) => config.pin === pin
  );
  return entry ? entry[1] : null;
};

// เช็คว่า role มี permission หรือไม่
APP_CONFIG.hasPermission = function(role, permission) {
  const roleConfig = this.PINS[role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
};

// Format message พร้อม placeholder
APP_CONFIG.formatMessage = function(key, params = {}) {
  let message = this.MESSAGES[key] || key;
  Object.keys(params).forEach(param => {
    message = message.replace(`{${param}}`, params[param]);
  });
  return message;
};

// ========================================
// EXPORT (ถ้าใช้ใน Node.js)
// ========================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}

// ========================================
// LOG (สำหรับ Debug)
// ========================================
console.log('✅ Config loaded:', {
  supabaseUrl: APP_CONFIG.SUPABASE_URL,
  roles: Object.keys(APP_CONFIG.PINS),
  dryerCount: APP_CONFIG.DRYER_COUNT,
  features: Object.keys(APP_CONFIG.FEATURES).filter(k => APP_CONFIG.FEATURES[k])
});
