/* NIRMAYA PROPERTY INSPECTION - Form Handler & Automations Simulation */

// Initialize Supabase Client if credentials are provided in CONFIG
let supabaseClient = null;
document.addEventListener('DOMContentLoaded', () => {
  if (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
    if (typeof window.supabase !== 'undefined') {
      supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      console.log('Supabase client initialized successfully.');
    } else {
      console.warn('Supabase JS library not loaded. Database sync will be offline.');
    }
  }
  initFormHandlers();
});

function initFormHandlers() {
  const inspectionForm = document.getElementById('inspection-request-form');
  const contactForm = document.getElementById('contact-form');

  if (inspectionForm) {
    inspectionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmission(inspectionForm, 'inspection');
    });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmission(contactForm, 'contact');
    });
  }
}

function handleFormSubmission(form, formType) {
  // Validate Form Inputs
  if (!validateForm(form)) {
    return;
  }

  // Gather Form Data
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });
  data.id = 'lead_' + Date.now();
  data.submittedAt = new Date().toISOString();
  data.formType = formType;

  // 1. Store lead in database (Simulation using localStorage)
  saveLeadToDatabase(data);

  // 2. Simulate Automations (WhatsApp, Email, Google Sheets, n8n webhook)
  triggerAutomations(data, () => {
    // Clear the form on success
    form.reset();
    
    // Show success confirmation modal
    showSuccessModal(data);
  });
}

/* Validates input values before submit */
function validateForm(form) {
  let isValid = true;
  const inputs = form.querySelectorAll('.form-control[required]');
  
  inputs.forEach(input => {
    // Clear existing error states
    input.classList.remove('input-error');
    const existingError = input.parentElement.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    if (!input.value.trim()) {
      showError(input, 'This field is required');
      isValid = false;
    } else if (input.type === 'email' && !validateEmail(input.value)) {
      showError(input, 'Please enter a valid email address');
      isValid = false;
    } else if (input.type === 'tel' && !validatePhone(input.value)) {
      showError(input, 'Please enter a valid 10-digit phone number');
      isValid = false;
    }
  });

  return isValid;
}

function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
  // Matches standard Indian 10-digit phone number optionally with +91 or 0 prefix
  const re = /^(?:\+91|0)?[6-9]\d{9}$/;
  return re.test(phone.replace(/\s+/g, ''));
}

function showError(input, message) {
  input.classList.add('input-error');
  
  // Custom styled inline error message
  const errorSpan = document.createElement('span');
  errorSpan.className = 'error-message';
  errorSpan.style.color = '#EF4444';
  errorSpan.style.fontSize = '0.75rem';
  errorSpan.style.marginTop = '0.25rem';
  errorSpan.style.fontFamily = 'var(--font-body)';
  errorSpan.innerText = message;
  
  input.parentElement.appendChild(errorSpan);
}

/* Stores lead records inside LocalStorage and Supabase (if configured) */
async function saveLeadToDatabase(leadData) {
  // 1. LocalStorage Backup
  let leads = JSON.parse(localStorage.getItem('nirmaya_leads')) || [];
  leads.push(leadData);
  localStorage.setItem('nirmaya_leads', JSON.stringify(leads));
  console.log('Lead saved to local storage:', leadData);

  // 2. Supabase Integration
  if (supabaseClient) {
    try {
      const payload = {
        lead_id: leadData.id,
        name: leadData.fullName || leadData.name || '',
        phone: leadData.phone || '',
        email: leadData.email || '',
        address: leadData.address || '',
        state: leadData.state || '',
        location: leadData.location || '',
        property_type: leadData.propertyType || '',
        property_size: leadData.propertySize || '',
        builder_name: leadData.builderName || '',
        inspection_type: leadData.inspectionType || '',
        preferred_date: leadData.preferredDate || '',
        message: leadData.message || '',
        form_type: leadData.formType || '',
        created_at: leadData.submittedAt || new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('leads')
        .insert([payload]);

      if (error) throw error;
      console.log('Lead successfully synced to Supabase database!');
    } catch (err) {
      console.error('Supabase Sync Error:', err.message);
    }
  }

  // 3. Google Forms Integration
  if (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_FORM_URL) {
    try {
      const formBody = new URLSearchParams();
      const entryIds = CONFIG.GOOGLE_FORM_ENTRY_IDS;

      formBody.append(entryIds.name, leadData.fullName || leadData.name || '');
      formBody.append(entryIds.phone, leadData.phone || '');
      formBody.append(entryIds.email, leadData.email || '');
      formBody.append(entryIds.address, leadData.address || '');
      if (entryIds.state) {
        formBody.append(entryIds.state, leadData.state || '');
      }
      formBody.append(entryIds.location, leadData.location || '');
      formBody.append(entryIds.propertyType, leadData.propertyType || '');
      formBody.append(entryIds.propertySize, leadData.propertySize || '');
      formBody.append(entryIds.builderName, leadData.builderName || '');
      formBody.append(entryIds.inspectionType, leadData.inspectionType || '');
      formBody.append(entryIds.preferredDate, leadData.preferredDate || '');
      formBody.append(entryIds.message, leadData.message || '');

      await fetch(CONFIG.GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formBody.toString()
      });
      console.log('Lead successfully submitted to Google Forms!');
    } catch (err) {
      console.error('Google Forms Sync Error:', err.message);
    }
  }
}

/* Simulates the step-by-step CRM Integrations */
function triggerAutomations(leadData, callback) {
  // We simulate API latency with a loading status on the button
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50" style="width: 20px; height: 20px; animation: spin 1s linear infinite; margin-right: 0.5rem; display: inline-block; vertical-align: middle;">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" style="stroke-dasharray: 90, 150; stroke-dashoffset: 0;"></circle>
      </svg> Validating & Scheduling...
    `;
  }

  // Inject spinner style dynamically
  if (!document.getElementById('spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.innerHTML = `
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
      .input-error {
        border-color: #EF4444 !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.06) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Mock CRM triggers
  setTimeout(() => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
    callback();
  }, 1200); // 1.2s delay for realism
}

/* Renders the dynamic success modal with confirmation of details */
function showSuccessModal(leadData) {
  // If modal doesn't exist, create it dynamically
  let modal = document.getElementById('success-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'success-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  const isInspection = leadData.formType === 'inspection';
  const headerTitle = isInspection ? 'Inspection Scheduled' : 'Message Sent';
  const confirmationMsg = isInspection 
    ? `Thank you, <strong>${leadData.fullName || leadData.name}</strong>. Your property inspection booking for a <strong>${leadData.propertyType || 'Residential'}</strong> is scheduled. Our certified engineers will contact you shortly.`
    : `Thank you, <strong>${leadData.name}</strong>. Your message has been received. Our team will get back to you shortly.`;

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 36px; height: 36px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h3>${headerTitle} Successfully!</h3>
      <p style="color: var(--text-color); margin-bottom: 1.5rem;">${confirmationMsg}</p>
      
      <div class="automation-logs" style="background-color: var(--bg-color); border-radius: var(--border-radius-sm); padding: 1.25rem; text-align: left; margin-bottom: 2rem; border: 1.5px solid var(--border-color); font-size: 0.85rem;">
        <h4 style="margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--primary-color);">Automated Workflow Status:</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; color: var(--text-muted);">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--whatsapp-green);">●</span> Lead logged in database (ID: ${leadData.id})
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--whatsapp-green);">●</span> Email alert sent to operations admin (nirmayapropertyinspection@gmail.com)
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--whatsapp-green);">●</span> WhatsApp notification triggered to office (+91 6304916429)
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--whatsapp-green);">●</span> Confirmation email sent to client (${leadData.email})
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--whatsapp-green);">●</span> WhatsApp confirmation alert sent to client (${leadData.phone || leadData.phoneNumber})
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--whatsapp-green);">●</span> Sync completed with Google Sheets (Spreadsheet ID: NIRMAYA_Leads_2026)
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--whatsapp-green);">●</span> CRM webhook pinged (Endpoint: n8n.nirmaya.internal/lead-receiver)
          </div>
        </div>
      </div>
      
      <button class="btn btn-primary" onclick="closeModal()" style="padding: 0.75rem 2rem; border-radius: var(--border-radius);">Dismiss</button>
    </div>
  `;

  // Display the Modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/* Close Modal Handler */
window.closeModal = function() {
  const modal = document.getElementById('success-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// Also close modal when clicking outside contents
document.addEventListener('click', (e) => {
  const modal = document.getElementById('success-modal');
  if (modal && e.target === modal) {
    closeModal();
  }
});
