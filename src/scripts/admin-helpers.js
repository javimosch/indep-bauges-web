/**
 * Admin Helpers
 *
 * Helper functions for the admin interface
 */

// Toast notification system
const ToastSystem = (function() {
  // Configuration
  const DEFAULT_DURATION = 3000;

  // Create toast container
  function setupToastContainer() {
    // Remove existing toast container if present
    const existingContainer = document.getElementById('admin-toast-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create toast container
    const toastContainer = document.createElement('div');
    toastContainer.id = 'admin-toast-container';
    toastContainer.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2';
    document.body.appendChild(toastContainer);

    // Add toast styles
    const toastStyles = document.createElement('style');
    toastStyles.id = 'admin-toast-styles';
    toastStyles.textContent = `
      .admin-toast {
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        color: white;
        font-size: 14px;
        max-width: 300px;
        margin-top: 8px;
        transform: translateY(20px);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .admin-toast.show {
        transform: translateY(0);
        opacity: 1;
      }
      .admin-toast-success {
        background-color: #10B981;
      }
      .admin-toast-error {
        background-color: #EF4444;
      }
      .admin-toast-info {
        background-color: #3B82F6;
      }
      .admin-toast-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
        margin-left: 8px;
        opacity: 0.7;
      }
      .admin-toast-close:hover {
        opacity: 1;
      }
    `;
    document.head.appendChild(toastStyles);
  }

  // Show toast notification
  function showToast(message, type = 'info', duration = DEFAULT_DURATION) {
    const toastContainer = document.getElementById('admin-toast-container');
    if (!toastContainer) {
      setupToastContainer();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast-${type}`;

    // Create message element
    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    toast.appendChild(messageEl);

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'admin-toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
      removeToast(toast);
    });
    toast.appendChild(closeBtn);

    // Add toast to container
    document.getElementById('admin-toast-container').appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(toast);
    }, duration);

    return toast;
  }

  // Remove toast
  function removeToast(toast) {
    if (!toast) return;

    // Trigger hide animation
    toast.classList.remove('show');

    // Remove after animation completes
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Public API
  return {
    setup: setupToastContainer,
    show: showToast,
    remove: removeToast
  };
})();

// Editor styles management
const EditorStyles = (function() {
  // Add styles for editable elements
  function addEditableStyles() {
    const existingStyle = document.getElementById('admin-editable-style');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'admin-editable-style';
    style.textContent = `
      .admin-editable {
        position: relative;
        outline: 2px dashed #3B82F6;
        cursor: pointer;
        transition: outline-color 0.3s;
      }
      .admin-editable:hover {
        outline-color: #2563EB;
      }
      .admin-editable::before {
        content: "✏️";
        position: absolute;
        top: -10px;
        right: -10px;
        background: #3B82F6;
        color: white;
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 10px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .admin-editable:hover::before {
        opacity: 1;
      }
      .admin-editing {
        outline: 2px solid #10B981;
      }
      .admin-editing::before {
        content: "Editing";
        background: #10B981;
        opacity: 1;
      }
      .admin-element-flash {
        animation: admin-flash-animation 0.3s ease;
      }
      @keyframes admin-flash-animation {
        0% { outline-color: transparent; outline-width: 0; }
        50% { outline-color: #3B82F6; outline-width: 4px; outline-style: solid; }
        100% { outline-color: transparent; outline-width: 0; }
      }
      #admin-editor {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        max-width: 800px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        padding: 20px;
        max-height: 80vh;
        overflow-y: auto;
      }
      #admin-editor textarea {
        width: 100%;
        min-height: 100px;
        margin-bottom: 10px;
        padding: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
      }
      #admin-editor-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
    `;

    document.head.appendChild(style);
  }

  // Remove editable styles
  function removeEditableStyles() {
    const existingStyle = document.getElementById('admin-editable-style');
    if (existingStyle) {
      existingStyle.remove();
    }
  }

  // Public API
  return {
    add: addEditableStyles,
    remove: removeEditableStyles
  };
})();

// Storage utilities
const StorageUtils = (function() {
  // Save data to localStorage
  function saveData(key, data, expiry = null) {
    const storageData = {
      data: data,
      expiry: expiry ? Date.now() + expiry : null
    };

    localStorage.setItem(key, JSON.stringify(storageData));
  }

  // Get data from localStorage
  function getData(key) {
    try {
      const storageData = JSON.parse(localStorage.getItem(key));

      if (!storageData) return null;

      // Check if data has expired
      if (storageData.expiry && storageData.expiry < Date.now()) {
        localStorage.removeItem(key);
        return null;
      }

      return storageData.data;
    } catch (e) {
      console.error('Error parsing storage data:', e);
      localStorage.removeItem(key);
      return null;
    }
  }

  // Remove data from localStorage
  function removeData(key) {
    localStorage.removeItem(key);
  }

  // Public API
  return {
    save: saveData,
    get: getData,
    remove: removeData
  };
})();

// API utilities
const ApiUtils = (function() {
  // Make an authenticated API request
  async function makeAuthenticatedRequest(endpoint, method = 'GET', data = null, authTokenKey = 'admin_auth_token') {
    console.log(`admin-helpers.js ApiUtils.makeAuthenticatedRequest Making ${method} request to ${endpoint}`, { data });
    
    try {
      const authData = StorageUtils.get(authTokenKey);
      
      if (!authData || !authData.token) {
        ToastSystem.show('Authentication required', 'error');
        return { success: false, message: 'Authentication required' };
      }
      
      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        }
      };
      
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(data);
      }
      
      const response = await fetch(endpoint, requestOptions);
      const result = await response.json();
      
      return result;
    } catch (err) {
      console.log(`admin-helpers.js ApiUtils.makeAuthenticatedRequest Error making request`, {message: err.message, stack: err.stack});
      return { success: false, message: `Error: ${err.message}` };
    }
  }
  
  // Public API
  return {
    request: makeAuthenticatedRequest
  };
})();

// Modal utilities
const ModalUtils = (function() {
  // Create or show a modal
  function createOrShowModal(id, content, options = {}) {
    console.log(`admin-helpers.js ModalUtils.createOrShowModal Creating/showing modal ${id}`);
    
    let modal = document.getElementById(id);
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = id;
      modal.className = options.className || 'fixed inset-0 flex items-center justify-center z-50';
      
      modal.innerHTML = content;
      document.body.appendChild(modal);
    } else {
      // Just show it
      modal.style.display = options.display || 'flex';
    }
    
    return modal;
  }
  
  // Close a modal
  function closeModal(id) {
    console.log(`admin-helpers.js ModalUtils.closeModal Closing modal ${id}`);
    
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  // Public API
  return {
    create: createOrShowModal,
    close: closeModal
  };
})();

// Form utilities
const FormUtils = (function() {
  // Get form values
  function getFormValues(fieldIds) {
    const values = {};
    let isValid = true;
    let missingFields = [];
    
    fieldIds.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (!element) {
        isValid = false;
        return;
      }
      
      const value = element.type === 'checkbox' ? element.checked : element.value.trim();
      values[fieldId] = value;
      
      if (!value && element.hasAttribute('required')) {
        isValid = false;
        missingFields.push(fieldId);
      }
    });
    
    return { values, isValid, missingFields };
  }
  
  // Set form values
  function setFormValues(values) {
    Object.keys(values).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = !!values[fieldId];
        } else {
          element.value = values[fieldId] || '';
        }
      }
    });
  }
  
  // Public API
  return {
    getValues: getFormValues,
    setValues: setFormValues
  };
})();

// Export modules
window.AdminHelpers = {
  Toast: ToastSystem,
  EditorStyles: EditorStyles,
  Storage: StorageUtils,
  Api: ApiUtils,
  Modal: ModalUtils,
  Form: FormUtils
};
