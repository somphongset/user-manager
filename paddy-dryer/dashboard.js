// ========================================
// PADDY DRYER MANAGEMENT SYSTEM
// Dashboard Forms & Data Management
// ========================================

const Dashboard = (function() {
  'use strict';

  // ========================================
  // PRIVATE VARIABLES
  // ========================================
  let currentModal = null;
  let currentDryerNumber = null;
  let currentBatchData = null;

  // ========================================
  // MODAL SYSTEM
  // ========================================
  
  /**
   * สร้าง Modal Template
   */
  function createModal(title, content, buttons = []) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'dashboardModal';
    
    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close" onclick="Dashboard.closeModal()">×</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${buttons.length > 0 ? `
          <div class="modal-footer">
            ${buttons.map(btn => `
              <button 
                class="btn ${btn.className || ''}" 
                onclick="${btn.onclick}"
                ${btn.disabled ? 'disabled' : ''}
              >
                ${btn.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    return modal;
  }

  /**
   * แสดง Modal
   */
  function showModal(modal) {
    // ปิด modal เดิม (ถ้ามี)
    closeModal();
    
    document.body.appendChild(modal);
    currentModal = modal;
    
    // เพิ่ม animation
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
    
    // ปิดเมื่อคลิกนอก modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // ปิดด้วย ESC key
    document.addEventListener('keydown', handleEscapeKey);
  }

  /**
   * ปิด Modal
   */
  function closeModal() {
    if (currentModal) {
      currentModal.classList.remove('active');
      setTimeout(() => {
        if (currentModal && currentModal.parentNode) {
          currentModal.parentNode.removeChild(currentModal);
        }
        currentModal = null;
        currentDryerNumber = null;
        currentBatchData = null;
      }, 300);
    }
    document.removeEventListener('keydown', handleEscapeKey);
  }

  /**
   * Handle ESC key
   */
  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }

  // ========================================
  // FORM: START NEW BATCH
  // ========================================
  
  /**
   * แสดง Form เริ่มงานใหม่
   */
  async function showStartBatchForm(dryerNumber) {
    // เช็ค permission
    if (!Auth.requirePermission('create')) {
      showError(APP_CONFIG.formatMessage('noPermission', { action: 'สร้างงานใหม่' }));
      return;
    }

    // เช็คว่าเครื่องว่างหรือไม่
    const isAvailable = await checkDryerAvailability(dryerNumber);
    if (!isAvailable) {
      showError(APP_CONFIG.formatMessage('dryerBusy', { number: dryerNumber }));
      return;
    }

    currentDryerNumber = dryerNumber;

    // สร้าง Batch Code อัตโนมัติ
    const suggestedBatchCode = await generateBatchCode(dryerNumber);
    const currentUser = Auth.getCurrentUser();

    const content = `
      <form id="startBatchForm" class="form">
        <div class="form-group">
          <label for="batchCode">
            Batch Code <span class="required">*</span>
          </label>
          <input 
            type="text" 
            id="batchCode" 
            value="${suggestedBatchCode}"
            required
            class="form-control"
            placeholder="D1-20251029-001"
          >
          <small class="form-help">รูปแบบ: D{เครื่อง}-YYYYMMDD-{ลำดับ}</small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="initialMoisture">
              ความชื้นเริ่มต้น (%) <span class="required">*</span>
            </label>
            <input 
              type="number" 
              id="initialMoisture" 
              step="0.1"
              min="${APP_CONFIG.MOISTURE_MIN}"
              max="${APP_CONFIG.MOISTURE_MAX}"
              required
              class="form-control"
              placeholder="24.5"
            >
            <small class="form-help">ช่วง: ${APP_CONFIG.MOISTURE_MIN}-${APP_CONFIG.MOISTURE_MAX}%</small>
          </div>

          <div class="form-group">
            <label for="targetMoisture">
              ความชื้นเป้าหมาย (%) <span class="required">*</span>
            </label>
            <input 
              type="number" 
              id="targetMoisture" 
              step="0.1"
              min="${APP_CONFIG.MOISTURE_MIN}"
              max="${APP_CONFIG.MOISTURE_MAX}"
              required
              class="form-control"
              placeholder="14.5"
              value="14.5"
            >
            <small class="form-help">ช่วง: ${APP_CONFIG.MOISTURE_MIN}-${APP_CONFIG.MOISTURE_MAX}%</small>
          </div>
        </div>

        <div class="form-group">
          <label for="operatorName">
            ผู้ดำเนินการ <span class="required">*</span>
          </label>
          <input 
            type="text" 
            id="operatorName" 
            required
            class="form-control"
            placeholder="ชื่อผู้ดำเนินการ"
            value="${currentUser.name || ''}"
          >
        </div>

        <div class="form-group">
          <label for="startTime">
            เวลาเริ่มป้อนข้าว
          </label>
          <input 
            type="datetime-local" 
            id="startTime" 
            class="form-control"
            value="${getCurrentDateTime()}"
          >
          <small class="form-help">ปล่อยว่างจะใช้เวลาปัจจุบัน</small>
        </div>

        <div class="form-group">
          <label for="notes">หมายเหตุ</label>
          <textarea 
            id="notes" 
            rows="3"
            class="form-control"
            placeholder="บันทึกเพิ่มเติม..."
          ></textarea>
        </div>

        <div id="formError" class="form-error hidden"></div>
      </form>
    `;

    const buttons = [
      {
        label: '❌ ยกเลิก',
        className: 'btn-secondary',
        onclick: 'Dashboard.closeModal()'
      },
      {
        label: '✅ เริ่มงาน',
        className: 'btn-primary',
        onclick: 'Dashboard.submitStartBatch()'
      }
    ];

    const modal = createModal(
      `🚀 เริ่มงานใหม่ - เครื่อง ${dryerNumber}`,
      content,
      buttons
    );

    showModal(modal);

    // Auto-focus ช่องแรก
    setTimeout(() => {
      document.getElementById('batchCode').focus();
    }, 100);
  }

  /**
   * Submit Form เริ่มงานใหม่
   */
  async function submitStartBatch() {
    const form = document.getElementById('startBatchForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // ดึงข้อมูลจาก form
    const formData = {
      dryer_number: currentDryerNumber,
      batch_code: document.getElementById('batchCode').value.trim(),
      initial_moisture: parseFloat(document.getElementById('initialMoisture').value),
      target_moisture: parseFloat(document.getElementById('targetMoisture').value),
      operator_name: document.getElementById('operatorName').value.trim(),
      start_time: document.getElementById('startTime').value || new Date().toISOString(),
      notes: document.getElementById('notes').value.trim(),
      status: 'loading' // เริ่มต้นเป็น "กำลังป้อนข้าว"
    };

    // Validation
    const validation = validateBatchData(formData);
    if (!validation.valid) {
      showFormError(validation.message);
      return;
    }

    // Disable buttons
    setFormLoading(true);

    try {
      // 1. Insert batch
      const { data: batch, error: batchError } = await window.supabaseClient
        .from('drying_batches')
        .insert({
          dryer_number: formData.dryer_number,
          batch_code: formData.batch_code,
          status: formData.status,
          start_time: formData.start_time,
          initial_moisture: formData.initial_moisture,
          target_moisture: formData.target_moisture,
          operator_name: formData.operator_name,
          notes: formData.notes,
          created_by: Auth.getRole()
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // 2. Insert initial reading
      const { error: readingError } = await window.supabaseClient
        .from('drying_readings')
        .insert({
          batch_id: batch.id,
          recorded_at: formData.start_time,
          moisture: formData.initial_moisture,
          temperature: null, // ยังไม่มีอุณหภูมิ
          operator_notes: 'ความชื้นเริ่มต้น',
          recorded_by: Auth.getRole()
        });

      if (readingError) throw readingError;

      // Success!
      showSuccess(APP_CONFIG.formatMessage('saveSuccess'));
      closeModal();
      
      // Reload dashboard
      if (typeof loadDashboard === 'function') {
        loadDashboard();
      }

    } catch (error) {
      console.error('Error starting batch:', error);
      showFormError('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  }

  // ========================================
  // FORM: RECORD DATA
  // ========================================
  
  /**
   * แสดง Form บันทึกค่า
   */
  async function showRecordDataForm(dryerNumber) {
    // เช็ค permission
    if (!Auth.requirePermission('create')) {
      showError(APP_CONFIG.formatMessage('noPermission', { action: 'บันทึกข้อมูล' }));
      return;
    }

    // ดึงข้อมูล batch ปัจจุบันของเครื่องนี้
    const batchData = await getActiveBatch(dryerNumber);
    if (!batchData) {
      showError(`ไม่พบงานที่กำลังดำเนินการในเครื่อง ${dryerNumber}`);
      return;
    }

    currentDryerNumber = dryerNumber;
    currentBatchData = batchData;

    // ดึงค่าล่าสุด (ถ้ามี)
    const latestReading = await getLatestReading(batchData.id);

    const content = `
      <div class="batch-info-box">
        <div><strong>Batch:</strong> ${batchData.batch_code}</div>
        <div><strong>เป้าหมาย:</strong> ${batchData.target_moisture}%</div>
        <div><strong>ความชื้นล่าสุด:</strong> ${latestReading ? latestReading.moisture + '%' : '-'}</div>
      </div>

      <form id="recordDataForm" class="form">
        <div class="form-group">
          <label for="recordedAt">
            เวลาที่บันทึก
          </label>
          <input 
            type="datetime-local" 
            id="recordedAt" 
            class="form-control"
            value="${getCurrentDateTime()}"
            max="${getCurrentDateTime()}"
          >
          <small class="form-help">ไม่สามารถบันทึกเวลาในอนาคตได้</small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="moisture">
              ความชื้น (%) <span class="required">*</span>
            </label>
            <input 
              type="number" 
              id="moisture" 
              step="0.1"
              min="${APP_CONFIG.MOISTURE_MIN}"
              max="${APP_CONFIG.MOISTURE_MAX}"
              required
              class="form-control"
              placeholder="15.5"
            >
            <small class="form-help">ช่วง: ${APP_CONFIG.MOISTURE_MIN}-${APP_CONFIG.MOISTURE_MAX}%</small>
          </div>

          <div class="form-group">
            <label for="temperature">
              อุณหภูมิ (°C)
            </label>
            <input 
              type="number" 
              id="temperature" 
              step="0.1"
              min="${APP_CONFIG.TEMP_MIN}"
              max="${APP_CONFIG.TEMP_MAX}"
              class="form-control"
              placeholder="45.0"
            >
            <small class="form-help">ช่วง: ${APP_CONFIG.TEMP_MIN}-${APP_CONFIG.TEMP_MAX}°C</small>
          </div>
        </div>

        <div class="form-group">
          <label for="operatorNotes">หมายเหตุ</label>
          <textarea 
            id="operatorNotes" 
            rows="3"
            class="form-control"
            placeholder="บันทึกสภาพข้าว, การตั้งค่าเครื่อง..."
          ></textarea>
        </div>

        ${latestReading && isNearTarget(latestReading.moisture, batchData.target_moisture) ? `
          <div class="alert alert-success">
            ✅ ความชื้นใกล้เป้าหมายแล้ว! พิจารณาจบงานหรือตรวจสอบอีกครั้ง
          </div>
        ` : ''}

        <div id="formError" class="form-error hidden"></div>
      </form>
    `;

    const buttons = [
      {
        label: '❌ ยกเลิก',
        className: 'btn-secondary',
        onclick: 'Dashboard.closeModal()'
      },
      {
        label: '💾 บันทึก',
        className: 'btn-primary',
        onclick: 'Dashboard.submitRecordData()'
      }
    ];

    const modal = createModal(
      `📝 บันทึกค่า - เครื่อง ${dryerNumber}`,
      content,
      buttons
    );

    showModal(modal);

    // Auto-focus
    setTimeout(() => {
      document.getElementById('moisture').focus();
    }, 100);
  }

  /**
   * Submit Form บันทึกค่า
   */
  async function submitRecordData() {
    const form = document.getElementById('recordDataForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = {
      batch_id: currentBatchData.id,
      recorded_at: document.getElementById('recordedAt').value || new Date().toISOString(),
      moisture: parseFloat(document.getElementById('moisture').value),
      temperature: document.getElementById('temperature').value 
        ? parseFloat(document.getElementById('temperature').value) 
        : null,
      operator_notes: document.getElementById('operatorNotes').value.trim()
    };

    // Validation
    const validation = validateReadingData(formData, currentBatchData);
    if (!validation.valid) {
      showFormError(validation.message);
      return;
    }

    setFormLoading(true);

    try {
      // Insert reading
      const { error } = await window.supabaseClient
        .from('drying_readings')
        .insert({
          batch_id: formData.batch_id,
          recorded_at: formData.recorded_at,
          moisture: formData.moisture,
          temperature: formData.temperature,
          operator_notes: formData.operator_notes,
          recorded_by: Auth.getRole()
        });

      if (error) throw error;

      // อัพเดทสถานะ batch เป็น "drying" ถ้ายังเป็น "loading"
      if (currentBatchData.status === 'loading') {
        await window.supabaseClient
          .from('drying_batches')
          .update({ 
            status: 'drying',
            start_drying_time: formData.recorded_at
          })
          .eq('id', currentBatchData.id);
      }

      showSuccess(APP_CONFIG.formatMessage('saveSuccess'));
      closeModal();
      
      if (typeof loadDashboard === 'function') {
        loadDashboard();
      }

    } catch (error) {
      console.error('Error recording data:', error);
      showFormError('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  }

  // ========================================
  // FORM: EDIT BATCH
  // ========================================
  
  /**
   * แสดง Form แก้ไขงาน
   */
  async function showEditBatchForm(dryerNumber) {
    // เช็ค permission
    if (!Auth.requirePermission('update')) {
      showError(APP_CONFIG.formatMessage('noPermission', { action: 'แก้ไขข้อมูล' }));
      return;
    }

    // ดึงข้อมูล batch
    const batchData = await getActiveBatch(dryerNumber);
    if (!batchData) {
      showError(`ไม่พบงานที่กำลังดำเนินการในเครื่อง ${dryerNumber}`);
      return;
    }

    // ไม่ให้แก้ไขงานที่เสร็จแล้ว
    if (batchData.status === 'completed' || batchData.status === 'cancelled') {
      showError(APP_CONFIG.formatMessage('cannotEdit'));
      return;
    }

    currentDryerNumber = dryerNumber;
    currentBatchData = batchData;

    // ดึง readings
    const readings = await getBatchReadings(batchData.id);
    const latestReading = readings[0];

    const content = `
      <div class="batch-info-box">
        <div><strong>Batch:</strong> ${batchData.batch_code}</div>
        <div><strong>เริ่มป้อน:</strong> ${formatDateTime(batchData.start_time)}</div>
        ${batchData.start_drying_time ? `
          <div><strong>เริ่มอบ:</strong> ${formatDateTime(batchData.start_drying_time)}</div>
        ` : ''}
      </div>

      <form id="editBatchForm" class="form">
        <div class="form-group">
          <label for="status">
            สถานะ <span class="required">*</span>
          </label>
          <select id="status" class="form-control" required>
            <option value="loading" ${batchData.status === 'loading' ? 'selected' : ''}>
              กำลังป้อนข้าว
            </option>
            <option value="drying" ${batchData.status === 'drying' ? 'selected' : ''}>
              กำลังอบ
            </option>
            <option value="unloading" ${batchData.status === 'unloading' ? 'selected' : ''}>
              กำลังอบออก
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="targetMoisture">
              ความชื้นเป้าหมาย (%) <span class="required">*</span>
            </label>
            <input 
              type="number" 
              id="targetMoisture" 
              step="0.1"
              min="${APP_CONFIG.MOISTURE_MIN}"
              max="${APP_CONFIG.MOISTURE_MAX}"
              value="${batchData.target_moisture}"
              required
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label>ความชื้นล่าสุด</label>
            <div class="form-control-static">
              ${latestReading ? latestReading.moisture + '%' : '-'}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="operatorName">ผู้ดำเนินการ</label>
          <input 
            type="text" 
            id="operatorName" 
            class="form-control"
            value="${batchData.operator_name || ''}"
          >
        </div>

        <div class="form-group">
          <label for="notes">หมายเหตุ</label>
          <textarea 
            id="notes" 
            rows="3"
            class="form-control"
          >${batchData.notes || ''}</textarea>
        </div>

        <div id="formError" class="form-error hidden"></div>
      </form>

      ${readings.length > 0 ? `
        <div class="readings-summary">
          <h4>การบันทึกล่าสุด (${readings.length} ครั้ง)</h4>
          <div class="readings-list">
            ${readings.slice(0, 5).map(r => `
              <div class="reading-item">
                <div class="reading-time">${formatDateTime(r.recorded_at)}</div>
                <div class="reading-values">
                  ความชื้น: <strong>${r.moisture}%</strong>
                  ${r.temperature ? `, อุณหภูมิ: <strong>${r.temperature}°C</strong>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    const buttons = [
      {
        label: '🗑️ ลบงาน',
        className: 'btn-danger',
        onclick: 'Dashboard.confirmDeleteBatch()'
      },
      {
        label: '✅ จบงาน',
        className: 'btn-success',
        onclick: 'Dashboard.confirmCompleteBatch()'
      },
      {
        label: '❌ ยกเลิก',
        className: 'btn-secondary',
        onclick: 'Dashboard.closeModal()'
      },
      {
        label: '💾 บันทึก',
        className: 'btn-primary',
        onclick: 'Dashboard.submitEditBatch()'
      }
    ];

    const modal = createModal(
      `✏️ แก้ไขงาน - เครื่อง ${dryerNumber}`,
      content,
      buttons
    );

    showModal(modal);
  }

  /**
   * Submit Form แก้ไขงาน
   */
  async function submitEditBatch() {
    const form = document.getElementById('editBatchForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = {
      status: document.getElementById('status').value,
      target_moisture: parseFloat(document.getElementById('targetMoisture').value),
      operator_name: document.getElementById('operatorName').value.trim(),
      notes: document.getElementById('notes').value.trim()
    };

    // Validation
    if (formData.target_moisture < APP_CONFIG.MOISTURE_MIN || 
        formData.target_moisture > APP_CONFIG.MOISTURE_MAX) {
      showFormError(APP_CONFIG.formatMessage('moistureOutOfRange', {
        min: APP_CONFIG.MOISTURE_MIN,
        max: APP_CONFIG.MOISTURE_MAX
      }));
      return;
    }

    setFormLoading(true);

    try {
      // เก็บค่าเก่าสำหรับ history
      const oldValues = {
        status: currentBatchData.status,
        target_moisture: currentBatchData.target_moisture,
        operator_name: currentBatchData.operator_name,
        notes: currentBatchData.notes
      };

      // อัพเดท batch
      const { error: updateError } = await window.supabaseClient
        .from('drying_batches')
        .update({
          status: formData.status,
          target_moisture: formData.target_moisture,
          operator_name: formData.operator_name,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentBatchData.id);

      if (updateError) throw updateError;

      // บันทึก history (ถ้าเปิดใช้งาน)
      if (APP_CONFIG.FEATURES.editHistory) {
        await window.supabaseClient
          .from('batch_history')
          .insert({
            batch_id: currentBatchData.id,
            change_type: 'edit',
            old_values: oldValues,
            new_values: formData,
            changed_by: Auth.getRole(),
            notes: 'แก้ไขข้อมูล batch'
          });
      }

      showSuccess(APP_CONFIG.formatMessage('updateSuccess'));
      closeModal();
      
      if (typeof loadDashboard === 'function') {
        loadDashboard();
      }

    } catch (error) {
      console.error('Error updating batch:', error);
      showFormError('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  }

  // ========================================
  // COMPLETE BATCH
  // ========================================
  
  /**
   * ยืนยันจบงาน
   */
  async function confirmCompleteBatch() {
    if (!currentBatchData) return;

    // ดึงค่าล่าสุด
    const latestReading = await getLatestReading(currentBatchData.id);
    if (!latestReading) {
      showError('ไม่พบข้อมูลความชื้น กรุณาบันทึกค่าก่อนจบงาน');
      return;
    }

    const finalMoisture = latestReading.moisture;
    const target = currentBatchData.target_moisture;
    const diff = Math.abs(finalMoisture - target);

    let message = `จบงาน ${currentBatchData.batch_code}?\n\n`;
    message += `ความชื้นสุดท้าย: ${finalMoisture}%\n`;
    message += `เป้าหมาย: ${target}%\n`;
    
    if (diff > 1) {
      message += `\n⚠️ ความชื้นยังห่างจากเป้าหมาย ${diff.toFixed(1)}%\nต้องการจบงานจริงหรือไม่?`;
    }

    if (!confirm(message)) return;

    setFormLoading(true);

    try {
      const now = new Date().toISOString();
      
      // คำนวณเวลาทั้งหมด
      const startTime = new Date(currentBatchData.start_drying_time || currentBatchData.start_time);
      const endTime = new Date(now);
      const totalHours = (endTime - startTime) / (1000 * 60 * 60);

      // อัพเดท batch
      const { error: updateError } = await window.supabaseClient
        .from('drying_batches')
        .update({
          status: 'completed',
          end_drying_time: now,
          final_moisture: finalMoisture,
          total_hours: totalHours,
          updated_at: now
        })
        .eq('id', currentBatchData.id);

      if (updateError) throw updateError;

      // บันทึก history
      if (APP_CONFIG.FEATURES.editHistory) {
        await window.supabaseClient
          .from('batch_history')
          .insert({
            batch_id: currentBatchData.id,
            change_type: 'complete',
            old_values: { status: currentBatchData.status },
            new_values: { 
              status: 'completed',
              final_moisture: finalMoisture,
              total_hours: totalHours
            },
            changed_by: Auth.getRole(),
            notes: 'จบงาน'
          });
      }

      showSuccess(`✅ จบงาน ${currentBatchData.batch_code} เรียบร้อย\nใช้เวลา: ${totalHours.toFixed(1)} ชม.`);
      closeModal();
      
      if (typeof loadDashboard === 'function') {
        loadDashboard();
      }

    } catch (error) {
      console.error('Error completing batch:', error);
      showFormError('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  }

  // ========================================
  // DELETE BATCH
  // ========================================
  
  /**
   * ยืนยันลบงาน
   */
  async function confirmDeleteBatch() {
    if (!currentBatchData) return;

    const message = `ลบงาน ${currentBatchData.batch_code}?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`;
    
    if (!confirm(message)) return;

    setFormLoading(true);

    try {
      if (APP_CONFIG.FEATURES.softDelete) {
        // Soft delete
        const now = new Date().toISOString();
        
        const { error: deleteError } = await window.supabaseClient
          .from('drying_batches')
          .update({
            deleted_at: now,
            deleted_by: Auth.getRole()
          })
          .eq('id', currentBatchData.id);

        if (deleteError) throw deleteError;

        // บันทึก history
        await window.supabaseClient
          .from('batch_history')
          .insert({
            batch_id: currentBatchData.id,
            change_type: 'delete',
            old_values: currentBatchData,
            new_values: { deleted_at: now },
            changed_by: Auth.getRole(),
            notes: 'ลบงาน (soft delete)'
          });

      } else {
        // Hard delete (ไม่แนะนำ)
        const { error: deleteError } = await window.supabaseClient
          .from('drying_batches')
          .delete()
          .eq('id', currentBatchData.id);

        if (deleteError) throw deleteError;
      }

      showSuccess(APP_CONFIG.formatMessage('deleteSuccess'));
      closeModal();
      
      if (typeof loadDashboard === 'function') {
        loadDashboard();
      }

    } catch (error) {
      console.error('Error deleting batch:', error);
      showFormError('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  }

  // ========================================
  // VALIDATION FUNCTIONS
  // ========================================
  
  /**
   * Validate Batch Data
   */
  function validateBatchData(data) {
    // ตรวจสอบความชื้น
    if (data.initial_moisture < APP_CONFIG.MOISTURE_MIN || 
        data.initial_moisture > APP_CONFIG.MOISTURE_MAX) {
      return {
        valid: false,
        message: APP_CONFIG.formatMessage('moistureOutOfRange', {
          min: APP_CONFIG.MOISTURE_MIN,
          max: APP_CONFIG.MOISTURE_MAX
        })
      };
    }

    if (data.target_moisture < APP_CONFIG.MOISTURE_MIN || 
        data.target_moisture > APP_CONFIG.MOISTURE_MAX) {
      return {
        valid: false,
        message: APP_CONFIG.formatMessage('moistureOutOfRange', {
          min: APP_CONFIG.MOISTURE_MIN,
          max: APP_CONFIG.MOISTURE_MAX
        })
      };
    }

    // เตือนถ้าความชื้นต่ำมาก
    if (data.initial_moisture < 12) {
      if (!confirm(APP_CONFIG.formatMessage('moistureTooLow', { value: data.initial_moisture }))) {
        return { valid: false, message: 'ยกเลิกโดยผู้ใช้' };
      }
    }

    // ตรวจสอบเวลา
    const startTime = new Date(data.start_time);
    const now = new Date();
    if (startTime > now) {
      return {
        valid: false,
        message: APP_CONFIG.formatMessage('futureTime')
      };
    }

    // ตรวจสอบ batch code
    if (!data.batch_code || data.batch_code.length < 5) {
      return {
        valid: false,
        message: 'Batch code ไม่ถูกต้อง'
      };
    }

    return { valid: true };
  }

  /**
   * Validate Reading Data
   */
  function validateReadingData(data, batchData) {
    // ตรวจสอบความชื้น
    if (data.moisture < APP_CONFIG.MOISTURE_MIN || 
        data.moisture > APP_CONFIG.MOISTURE_MAX) {
      return {
        valid: false,
        message: APP_CONFIG.formatMessage('moistureOutOfRange', {
          min: APP_CONFIG.MOISTURE_MIN,
          max: APP_CONFIG.MOISTURE_MAX
        })
      };
    }

    // ตรวจสอบอุณหภูมิ
    if (data.temperature !== null) {
      if (data.temperature < APP_CONFIG.TEMP_MIN || 
          data.temperature > APP_CONFIG.TEMP_MAX) {
        return {
          valid: false,
          message: APP_CONFIG.formatMessage('tempOutOfRange', {
            min: APP_CONFIG.TEMP_MIN,
            max: APP_CONFIG.TEMP_MAX
          })
        };
      }

      // เตือนอุณหภูมิสูง
      if (data.temperature > 70) {
        if (!confirm(APP_CONFIG.formatMessage('tempTooHigh', { value: data.temperature }))) {
          return { valid: false, message: 'ยกเลิกโดยผู้ใช้' };
        }
      }
    }

    // ตรวจสอบเวลา
    const recordedTime = new Date(data.recorded_at);
    const now = new Date();
    const batchStart = new Date(batchData.start_time);

    if (recordedTime > now) {
      return {
        valid: false,
        message: APP_CONFIG.formatMessage('futureTime')
      };
    }

    if (recordedTime < batchStart) {
      return {
        valid: false,
        message: APP_CONFIG.formatMessage('timeBeforeStart')
      };
    }

    return { valid: true };
  }

  // ========================================
  // DATABASE HELPER FUNCTIONS
  // ========================================
  
  /**
   * ตรวจสอบว่าเครื่องว่างหรือไม่
   */
  async function checkDryerAvailability(dryerNumber) {
    try {
      const { data, error } = await window.supabaseClient
        .from('drying_batches')
        .select('id, batch_code, status')
        .eq('dryer_number', dryerNumber)
        .in('status', ['loading', 'drying', 'unloading'])
        .is('deleted_at', null)
        .limit(1);

      if (error) throw error;
      return data.length === 0;

    } catch (error) {
      console.error('Error checking dryer availability:', error);
      return false;
    }
  }

  /**
   * สร้าง Batch Code อัตโนมัติ
   */
  async function generateBatchCode(dryerNumber) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    try {
      // นับจำนวน batch ของวันนี้
      const { data, error } = await window.supabaseClient
        .from('drying_batches')
        .select('batch_code')
        .eq('dryer_number', dryerNumber)
        .gte('start_time', today.toISOString().split('T')[0])
        .order('batch_code', { ascending: false })
        .limit(1);

      if (error) throw error;

      let sequence = 1;
      if (data && data.length > 0) {
        // แยกเลขลำดับจาก batch code ล่าสุด
        const lastCode = data[0].batch_code;
        const match = lastCode.match(/-(\d+)$/);
        if (match) {
          sequence = parseInt(match[1]) + 1;
        }
      }

      return `D${dryerNumber}-${dateStr}-${sequence.toString().padStart(3, '0')}`;

    } catch (error) {
      console.error('Error generating batch code:', error);
      return `D${dryerNumber}-${dateStr}-001`;
    }
  }

  /**
   * ดึงข้อมูล batch ที่กำลังทำอยู่
   */
  async function getActiveBatch(dryerNumber) {
    try {
      const { data, error } = await window.supabaseClient
        .from('drying_batches')
        .select('*')
        .eq('dryer_number', dryerNumber)
        .in('status', ['loading', 'drying', 'unloading'])
        .is('deleted_at', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;

    } catch (error) {
      console.error('Error getting active batch:', error);
      return null;
    }
  }

  /**
   * ดึงค่าอ่านล่าสุด
   */
  async function getLatestReading(batchId) {
    try {
      const { data, error } = await window.supabaseClient
        .from('drying_readings')
        .select('*')
        .eq('batch_id', batchId)
        .is('deleted_at', null)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;

    } catch (error) {
      console.error('Error getting latest reading:', error);
      return null;
    }
  }

  /**
   * ดึงการบันทึกทั้งหมดของ batch
   */
  async function getBatchReadings(batchId) {
    try {
      const { data, error } = await window.supabaseClient
        .from('drying_readings')
        .select('*')
        .eq('batch_id', batchId)
        .is('deleted_at', null)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting batch readings:', error);
      return [];
    }
  }

  // ========================================
  // UI HELPER FUNCTIONS
  // ========================================
  
  /**
   * แสดง Error ใน Form
   */
  function showFormError(message) {
    const errorDiv = document.getElementById('formError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  /**
   * ซ่อน Error
   */
  function hideFormError() {
    const errorDiv = document.getElementById('formError');
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
  }

  /**
   * แสดง Loading State
   */
  function setFormLoading(loading) {
    const buttons = currentModal?.querySelectorAll('.modal-footer button');
    if (buttons) {
      buttons.forEach(btn => {
        btn.disabled = loading;
        if (loading && btn.classList.contains('btn-primary')) {
          btn.textContent = '⏳ กำลังบันทึก...';
        }
      });
    }
  }

  /**
   * แสดง Success Message
   */
  function showSuccess(message) {
    alert('✅ ' + message);
  }

  /**
   * แสดง Error Message
   */
  function showError(message) {
    alert('❌ ' + message);
  }

  /**
   * Format DateTime สำหรับ input
   */
  function getCurrentDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  /**
   * Format DateTime สำหรับแสดงผล
   */
  function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * เช็คว่าความชื้นใกล้เป้าหมายหรือไม่
   */
  function isNearTarget(current, target) {
    if (!current || !target) return false;
    return Math.abs(current - target) <= 0.5;
  }

  // ========================================
  // PUBLIC API
  // ========================================
  
  return {
    // Modal
    closeModal: closeModal,
    
    // Forms
    showStartBatchForm: showStartBatchForm,
    submitStartBatch: submitStartBatch,
    showRecordDataForm: showRecordDataForm,
    submitRecordData: submitRecordData,
    showEditBatchForm: showEditBatchForm,
    submitEditBatch: submitEditBatch,
    
    // Actions
    confirmCompleteBatch: confirmCompleteBatch,
    confirmDeleteBatch: confirmDeleteBatch,
    
    // Helpers
    checkDryerAvailability: checkDryerAvailability,
    generateBatchCode: generateBatchCode
  };

})();

// ========================================
// CSS STYLES FOR MODAL
// ========================================

// เพิ่ม styles dynamically
(function() {
  const style = document.createElement('style');
  style.textContent = `
    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s;
      padding: 20px;
    }

    .modal-overlay.active {
      opacity: 1;
    }

    /* Modal Container */
    .modal-container {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s;
    }

    .modal-overlay.active .modal-container {
      transform: scale(1);
    }

    /* Modal Header */
    .modal-header {
      padding: 20px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5em;
    }

    .modal-close {
      background: none;
      border: none;
      color: white;
      font-size: 32px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.3s;
    }

    .modal-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Modal Body */
    .modal-body {
      padding: 30px;
      overflow-y: auto;
      flex: 1;
    }

    /* Modal Footer */
    .modal-footer {
      padding: 20px 30px;
      background: var(--gray-50);
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    /* Form Styles */
    .form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .form-group label {
      font-weight: 600;
      color: var(--gray-700);
      font-size: 14px;
    }

    .required {
      color: var(--danger);
    }

    .form-control {
      padding: 10px 15px;
      border: 2px solid var(--gray-300);
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary);
    }

    .form-control:disabled {
      background: var(--gray-100);
      cursor: not-allowed;
    }

    .form-control-static {
      padding: 10px 15px;
      background: var(--gray-100);
      border-radius: 8px;
      font-weight: 600;
    }

    .form-help {
      font-size: 12px;
      color: var(--gray-700);
    }

    .form-error {
      padding: 12px;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 8px;
      border-left: 4px solid var(--danger);
    }

    /* Batch Info Box */
    .batch-info-box {
      background: var(--gray-50);
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-size: 14px;
    }

    .batch-info-box strong {
      color: var(--gray-900);
    }

    /* Readings Summary */
    .readings-summary {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid var(--gray-200);
    }

    .readings-summary h4 {
      margin-bottom: 15px;
      color: var(--gray-900);
    }

    .readings-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .reading-item {
      padding: 10px;
      background: var(--gray-50);
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .reading-time {
      font-size: 13px;
      color: var(--gray-700);
    }

    .reading-values {
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .modal-container {
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .batch-info-box {
        grid-template-columns: 1fr;
      }

      .modal-footer {
        flex-wrap: wrap;
      }

      .modal-footer .btn {
        flex: 1;
        min-width: 120px;
      }
    }
  `;
  
  document.head.appendChild(style);
})();

// ========================================
// LOG
// ========================================
console.log('✅ Dashboard.js loaded');
console.log('📋 Available functions:', Object.keys(Dashboard));
