// ========================================
// PADDY DRYER MANAGEMENT SYSTEM
// Supabase Client Loader with Smart Strategy
// ========================================

(function() {
  'use strict';

  console.log('🔄 Loading Supabase Client...');

  // ========================================
  // STRATEGY 1: Try Multiple CDNs with Promise
  // ========================================
  const CDN_SOURCES = [
    {
      name: 'ESM.sh (Fastest)',
      type: 'module',
      load: async () => {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        return { createClient };
      }
    },
    {
      name: 'UNPKG',
      type: 'script',
      url: 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
    },
    {
      name: 'jsDelivr',
      type: 'script',
      url: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
    }
  ];

  let currentAttempt = 0;
  const MAX_ATTEMPTS = 3;
  const TIMEOUT_MS = 8000; // 8 seconds per attempt

  // ========================================
  // LOAD FUNCTION
  // ========================================
  async function loadSupabase() {
    // Try ESM first (fastest)
    try {
      console.log('🔄 Trying ESM import...');
      const module = await Promise.race([
        CDN_SOURCES[0].load(),
        timeout(TIMEOUT_MS, 'ESM import timeout')
      ]);
      
      window.supabase = module;
      console.log('✅ Supabase loaded via ESM');
      return true;
    } catch (error) {
      console.warn('⚠️ ESM failed:', error.message);
    }

    // Try UMD from different CDNs
    for (let i = 1; i < CDN_SOURCES.length; i++) {
      try {
        const source = CDN_SOURCES[i];
        console.log(`🔄 Trying ${source.name}...`);
        
        await loadScript(source.url, TIMEOUT_MS);
        
        // Check if loaded successfully
        if (typeof window.supabase !== 'undefined' && 
            typeof window.supabase.createClient === 'function') {
          console.log(`✅ Supabase loaded via ${source.name}`);
          return true;
        }
      } catch (error) {
        console.warn(`⚠️ ${CDN_SOURCES[i].name} failed:`, error.message);
      }
    }

    return false;
  }

  // ========================================
  // LOAD SCRIPT WITH TIMEOUT
  // ========================================
  function loadScript(url, timeoutMs) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Script load timeout'));
      }, timeoutMs);

      script.onload = () => {
        clearTimeout(timeoutId);
        // Wait a bit for script to execute
        setTimeout(() => {
          cleanup();
          resolve();
        }, 100);
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        cleanup();
        reject(new Error('Script load error'));
      };

      function cleanup() {
        script.onload = null;
        script.onerror = null;
      }

      document.head.appendChild(script);
    });
  }

  // ========================================
  // TIMEOUT HELPER
  // ========================================
  function timeout(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  // ========================================
  // DEMO MODE (Fallback)
  // ========================================
  function createDemoClient() {
    console.log('🎭 Creating Demo Supabase Client...');

    return {
      createClient: (url, key) => {
        console.log('🎭 Demo Mode Active');
        
        return {
          from: (table) => ({
            select: (columns) => ({
              order: (column) => Promise.resolve({
                data: getDemoData(table),
                error: null
              }),
              eq: (column, value) => ({
                single: () => Promise.resolve({
                  data: getDemoData(table)[0] || null,
                  error: null
                })
              })
            }),
            insert: (data) => Promise.resolve({ 
              data: data, 
              error: null 
            }),
            update: (data) => ({
              eq: (column, value) => Promise.resolve({ 
                data: data, 
                error: null 
              })
            }),
            delete: () => ({
              eq: (column, value) => Promise.resolve({ 
                data: null, 
                error: null 
              })
            })
          }),
          channel: (name) => ({
            on: () => ({ 
              on: () => ({ 
                subscribe: () => console.log('🎭 Demo realtime (no-op)') 
              }) 
            })
          }),
          removeChannel: () => {},
          auth: {
            signIn: () => Promise.resolve({ data: null, error: null }),
            signOut: () => Promise.resolve({ error: null })
          }
        };
      }
    };
  }

  // ========================================
  // DEMO DATA
  // ========================================
  function getDemoData(table) {
    const data = {
      dashboard_summary: [
        {
          dryer_number: 1,
          status: 'drying',
          batch_code: 'D1-20251029-001',
          start_drying_time: new Date(Date.now() - 14.5 * 60 * 60 * 1000).toISOString(),
          hours_elapsed: 14.5,
          target_moisture: 15.0,
          latest_moisture: 16.5,
          operator_name: 'สมชาย'
        },
        {
          dryer_number: 2,
          status: 'available',
          batch_code: null,
          start_drying_time: null,
          hours_elapsed: null,
          target_moisture: null,
          latest_moisture: null,
          operator_name: null
        },
        {
          dryer_number: 3,
          status: 'drying',
          batch_code: 'D3-20251029-001',
          start_drying_time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          hours_elapsed: 8.0,
          target_moisture: 14.5,
          latest_moisture: 18.2,
          operator_name: 'สมหญิง'
        },
        {
          dryer_number: 4,
          status: 'loading',
          batch_code: 'D4-20251029-001',
          start_drying_time: null,
          hours_elapsed: null,
          target_moisture: 15.0,
          latest_moisture: 24.5,
          operator_name: 'สมศักดิ์'
        },
        {
          dryer_number: 5,
          status: 'drying',
          batch_code: 'D5-20251029-001',
          start_drying_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          hours_elapsed: 12.0,
          target_moisture: 14.0,
          latest_moisture: 15.8,
          operator_name: 'สมพงษ์'
        }
      ]
    };

    return data[table] || [];
  }

  // ========================================
  // MAIN EXECUTION
  // ========================================
  window.SupabaseLoader = {
    loaded: false,
    demoMode: false,

    async load() {
      if (this.loaded) {
        console.log('✅ Supabase already loaded');
        return true;
      }

      console.log('🚀 Starting Supabase load...');
      const success = await loadSupabase();

      if (success) {
        this.loaded = true;
        this.demoMode = false;
        return true;
      }

      // Fallback to demo mode
      console.warn('⚠️ All CDNs failed, using Demo Mode');
      window.supabase = createDemoClient();
      this.loaded = true;
      this.demoMode = true;
      
      // Show notification
      if (typeof window.showDemoNotification === 'function') {
        window.showDemoNotification();
      }

      return true;
    },

    isReady() {
      return this.loaded && 
             typeof window.supabase !== 'undefined' && 
             typeof window.supabase.createClient === 'function';
    }
  };

  // Auto-load on script load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.SupabaseLoader.load();
    });
  } else {
    window.SupabaseLoader.load();
  }

  console.log('✅ Supabase Loader initialized');
})();
