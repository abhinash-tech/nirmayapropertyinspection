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

  // Send Email securely via our Vercel Serverless Function Backend
  fetch("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(leadData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log("Email sent securely via backend");
    } else {
      console.warn("Backend response:", data.error);
    }
    finishAutomation();
  })
  .catch(error => {
    console.error("Error communicating with secure backend:", error);
    finishAutomation();
  });

  function finishAutomation() {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
    callback();
  }
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

  const waFormatKey = (key) => {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  let waText = `Hello NIRMAYA Property Inspection, I just submitted a ${isInspection ? 'property inspection' : 'contact'} request. Here are my details:\n\n`;
  
  for (const [key, value] of Object.entries(leadData)) {
    if (key !== 'id' && key !== 'submittedAt' && key !== 'formType' && value) {
      waText += `*${waFormatKey(key)}:* ${value}\n`;
    }
  }
  
  const waUrl = `https://wa.me/919492868528?text=${encodeURIComponent(waText)}`;

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 450px;">
      <div class="modal-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 36px; height: 36px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h3>${headerTitle} Successfully!</h3>
      <p style="color: var(--text-color); margin-bottom: 2rem;">${confirmationMsg}</p>
      
      <p style="font-size: 0.95rem; margin-bottom: 1.5rem; color: var(--text-muted); font-weight: 500;">Would you like to instantly forward your details to our team via WhatsApp for faster communication?</p>

      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="${waUrl}" target="_blank" onclick="closeModal()" class="btn btn-whatsapp" style="border-radius: var(--border-radius-sm); text-decoration: none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.977h.004c4.368 0 7.926-3.559 7.93-7.93a7.897 7.897 0 0 0-2.33-5.617l-.001-.005zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.69-4.98c-.202-.1-1.194-.588-1.378-.654-.184-.066-.317-.1-.452.1-.134.2-.521.654-.638.787-.117.135-.235.15-.437.05-.202-.1-.852-.313-1.624-.999-.6-.535-1.005-1.197-1.122-1.398-.117-.2-.012-.307.088-.407.09-.091.202-.234.302-.35.101-.117.135-.2.203-.335.067-.133.033-.25-.017-.35-.05-.1-.452-1.09-.618-1.498-.162-.394-.326-.34-.452-.347-.116-.007-.248-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.2-.699.683-.699 1.666 0 .983.715 1.932.815 2.066.1.135 1.4 2.136 3.393 2.993.475.204.846.326 1.137.418.477.151.91.13 1.253.08.384-.059 1.194-.488 1.362-.96.168-.472.168-.876.118-.96-.05-.085-.184-.135-.386-.235z"/>
          </svg> Send via WhatsApp
        </a>
        <button class="btn" onclick="closeModal()" style="border-radius: var(--border-radius-sm); border: 1.5px solid var(--border-color); background: transparent; color: var(--text-color);">Dismiss</button>
      </div>
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
