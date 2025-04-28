/**
 * Admin Inline Editing Script
 *
 * This script provides inline editing capabilities for administrators.
 * It includes:
 * - Password protection (123456)
 * - Inline editing of content elements (h1-h6, p, a, button)
 * - API endpoint handling for saving changes
 * - Admin navigation bar
 */

(function() {
  // Configuration
  const CONFIG = {
    apiEndpoint: '/api/save-content',
    authEndpoint: '/api/auth',
    editableSelectors: 'h1, h2, h3, h4, h5, h6, p, a, button',
    storageKey: 'admin_auth_token',
    authTokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  };

  // State
  let state = {
    isAuthenticated: false,
    isEditMode: false,
    lastEditTimestamp: null,
    currentlyEditing: null,
    adminName: localStorage.getItem('admin_name') || ''
  };

  // Initialize admin functionality
  function init() {
    checkAuthentication();
    setupEventListeners();
  }

  // Check if user is already authenticated
  function checkAuthentication() {
    const authData = localStorage.getItem(CONFIG.storageKey);

    if (authData) {
      try {
        const { token, expiry } = JSON.parse(authData);
        if (expiry > Date.now()) {
          // Verify token with server
          fetch(CONFIG.authEndpoint + '/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              state.isAuthenticated = true;
              createAdminBar();
            } else {
              // Token invalid
              localStorage.removeItem(CONFIG.storageKey);
            }
          })
          .catch(error => {
            console.error('Token verification error:', error);
            localStorage.removeItem(CONFIG.storageKey);
          });
        } else {
          // Token expired
          localStorage.removeItem(CONFIG.storageKey);
        }
      } catch (e) {
        console.error('Error parsing auth data:', e);
        localStorage.removeItem(CONFIG.storageKey);
      }
    }
  }

  // Set up event listeners
  function setupEventListeners() {
    // Listen for keyboard shortcut (Ctrl+Shift+A) to show login prompt
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        if (!state.isAuthenticated) {
          showLoginPrompt();
        }
      }
    });

    // Listen for edit mode toggle
    document.addEventListener('click', function(e) {
      if (e.target.id === 'admin-toggle-edit') {
        toggleEditMode();
      } else if (e.target.id === 'admin-logout') {
        logout();
      } else if (e.target.id === 'admin-open-new-tab') {
        window.open(window.location.href, '_blank');
      } else if (e.target.id === 'admin-save-name') {
        saveAdminName();
      }
    });
  }

  // Show login prompt
  function showLoginPrompt() {
    const password = prompt('Enter admin password:');

    if (password !== null && password.trim() !== '') {
      // Authenticate via API
      fetch(CONFIG.authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Authentication failed');
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          state.isAuthenticated = true;

          // Store authentication token
          const expiry = Date.now() + CONFIG.authTokenExpiry;
          localStorage.setItem(CONFIG.storageKey, JSON.stringify({
            token: data.token,
            expiry
          }));

          createAdminBar();
        } else {
          alert('Authentication failed: ' + (data.message || 'Invalid password'));
        }
      })
      .catch(error => {
        console.error('Authentication error:', error);
        alert('Authentication error. Please try again.');
      });
    }
  }

  // Create admin bar
  function createAdminBar() {
    // Remove existing admin bar if present
    const existingBar = document.getElementById('admin-bar');
    if (existingBar) {
      existingBar.remove();
    }

    // Create admin bar
    const adminBar = document.createElement('div');
    adminBar.id = 'admin-bar';
    adminBar.className = 'fixed top-0 left-0 right-0 bg-gray-800 text-white p-2 z-[9999] flex items-center justify-between';

    // Left side - status and controls
    const leftControls = document.createElement('div');
    leftControls.className = 'flex items-center gap-4';

    // Admin indicator
    const adminIndicator = document.createElement('div');
    adminIndicator.className = 'font-bold';
    adminIndicator.textContent = 'ADMIN MODE';
    leftControls.appendChild(adminIndicator);

    // Edit mode toggle
    const editToggle = document.createElement('button');
    editToggle.id = 'admin-toggle-edit';
    editToggle.className = 'px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 transition-colors';
    editToggle.textContent = 'Enable Edit Mode';
    leftControls.appendChild(editToggle);

    // Last edit timestamp
    const lastEdit = document.createElement('div');
    lastEdit.id = 'admin-last-edit';
    lastEdit.className = 'text-sm text-gray-300';
    lastEdit.textContent = state.lastEditTimestamp
      ? `Last edit: ${new Date(state.lastEditTimestamp).toLocaleString()}`
      : 'No recent edits';
    leftControls.appendChild(lastEdit);

    // Admin name input
    const adminNameContainer = document.createElement('div');
    adminNameContainer.className = 'flex items-center gap-2 ml-4';

    const adminNameLabel = document.createElement('label');
    adminNameLabel.htmlFor = 'admin-name-input';
    adminNameLabel.className = 'text-sm text-gray-300';
    adminNameLabel.textContent = 'Your name:';
    adminNameContainer.appendChild(adminNameLabel);

    const adminNameInput = document.createElement('input');
    adminNameInput.id = 'admin-name-input';
    adminNameInput.type = 'text';
    adminNameInput.className = 'px-2 py-1 rounded text-sm bg-gray-700 border border-gray-600 text-white';
    adminNameInput.placeholder = 'Enter your name';
    adminNameInput.value = state.adminName;
    adminNameContainer.appendChild(adminNameInput);

    const adminNameSave = document.createElement('button');
    adminNameSave.id = 'admin-save-name';
    adminNameSave.className = 'px-2 py-1 rounded bg-gray-600 hover:bg-gray-700 transition-colors text-sm';
    adminNameSave.textContent = 'Save';
    adminNameContainer.appendChild(adminNameSave);

    leftControls.appendChild(adminNameContainer);

    // Right side - additional actions
    const rightControls = document.createElement('div');
    rightControls.className = 'flex items-center gap-4';

    // MongoDB sync status
    const mongoStatus = document.createElement('div');
    mongoStatus.id = 'admin-mongo-status';
    mongoStatus.className = 'text-sm text-gray-300';
    mongoStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-gray-500 mr-1"></span> MongoDB';
    rightControls.appendChild(mongoStatus);

    // Open in new tab
    const openNewTab = document.createElement('button');
    openNewTab.id = 'admin-open-new-tab';
    openNewTab.className = 'px-3 py-1 rounded bg-gray-600 hover:bg-gray-700 transition-colors';
    openNewTab.textContent = 'Open in New Tab';
    rightControls.appendChild(openNewTab);

    // Logout button
    const logoutButton = document.createElement('button');
    logoutButton.id = 'admin-logout';
    logoutButton.className = 'px-3 py-1 rounded bg-red-600 hover:bg-red-700 transition-colors';
    logoutButton.textContent = 'Logout';
    rightControls.appendChild(logoutButton);

    // Assemble admin bar
    adminBar.appendChild(leftControls);
    adminBar.appendChild(rightControls);

    // Add admin bar to document
    document.body.prepend(adminBar);

    // Add padding to body to prevent content from being hidden behind admin bar
    document.body.style.paddingTop = adminBar.offsetHeight + 'px';
  }

  // Save admin name
  function saveAdminName() {
    const nameInput = document.getElementById('admin-name-input');
    if (nameInput) {
      state.adminName = nameInput.value.trim();
      localStorage.setItem('admin_name', state.adminName);
      alert(`Name saved: ${state.adminName}`);
    }
  }

  // Toggle edit mode
  function toggleEditMode() {
    state.isEditMode = !state.isEditMode;

    const editToggle = document.getElementById('admin-toggle-edit');
    if (editToggle) {
      editToggle.textContent = state.isEditMode ? 'Disable Edit Mode' : 'Enable Edit Mode';
      editToggle.className = state.isEditMode
        ? 'px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-700 transition-colors'
        : 'px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 transition-colors';
    }

    if (state.isEditMode) {
      enableEditableElements();
    } else {
      disableEditableElements();
    }
  }

  // Enable editable elements
  function enableEditableElements() {
    const elements = document.querySelectorAll(CONFIG.editableSelectors);

    elements.forEach(element => {
      if (element.getAttribute('data-id')) {
        element.classList.add('admin-editable');
        element.addEventListener('click', handleEditableClick);
      }
    });

    // Add editable style
    addEditableStyles();
  }

  // Disable editable elements
  function disableEditableElements() {
    const elements = document.querySelectorAll('.admin-editable');

    elements.forEach(element => {
      element.classList.remove('admin-editable');
      element.removeEventListener('click', handleEditableClick);
    });

    // Remove editable style
    const existingStyle = document.getElementById('admin-editable-style');
    if (existingStyle) {
      existingStyle.remove();
    }
  }

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

  // Handle click on editable element
  function handleEditableClick(e) {
    if (!state.isEditMode) return;

    e.preventDefault();
    e.stopPropagation();

    const element = e.currentTarget;

    // Don't allow editing if already editing another element
    if (state.currentlyEditing && state.currentlyEditing !== element) {
      return;
    }

    // Toggle editing state
    if (element.classList.contains('admin-editing')) {
      closeEditor();
    } else {
      openEditor(element);
    }
  }

  // Open editor for element
  function openEditor(element) {
    // Mark as currently editing
    state.currentlyEditing = element;
    element.classList.add('admin-editing');

    // Create editor
    const editor = document.createElement('div');
    editor.id = 'admin-editor';

    // Get content to edit
    let content = '';
    if (element.tagName.toLowerCase() === 'a' || element.tagName.toLowerCase() === 'button') {
      content = element.innerHTML;
    } else {
      content = element.innerHTML;
    }

    // Create editor form
    editor.innerHTML = `
      <h3 class="text-lg font-bold mb-2">Edit Content</h3>
      <p class="text-sm text-gray-500 mb-4">Element: ${element.tagName.toLowerCase()} (ID: ${element.getAttribute('data-id')})</p>
      <textarea id="admin-editor-content">${content}</textarea>
      <div id="admin-editor-buttons">
        <button id="admin-editor-cancel" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">Cancel</button>
        <button id="admin-editor-save" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Save Changes</button>
      </div>
    `;

    // Add editor to document
    document.body.appendChild(editor);

    // Focus textarea
    setTimeout(() => {
      document.getElementById('admin-editor-content').focus();
    }, 100);

    // Add event listeners
    document.getElementById('admin-editor-cancel').addEventListener('click', closeEditor);
    document.getElementById('admin-editor-save').addEventListener('click', () => saveChanges(element));
  }

  // Close editor
  function closeEditor() {
    if (state.currentlyEditing) {
      state.currentlyEditing.classList.remove('admin-editing');
      state.currentlyEditing = null;
    }

    const editor = document.getElementById('admin-editor');
    if (editor) {
      editor.remove();
    }
  }

  // Save changes
  function saveChanges(element) {
    const content = document.getElementById('admin-editor-content').value;
    const elementId = element.getAttribute('data-id');
    const elementType = element.tagName.toLowerCase();

    // Update element content temporarily
    if (elementType === 'a' || elementType === 'button') {
      element.innerHTML = content;
    } else {
      element.innerHTML = content;
    }

    // Get auth token
    const authData = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
    const token = authData.token || '';

    // Send to API
    fetch(CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        elementId,
        elementType,
        content,
        path: window.location.pathname,
        adminName: state.adminName || 'unknown'
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Update last edit timestamp
      state.lastEditTimestamp = new Date();
      const lastEditElement = document.getElementById('admin-last-edit');
      if (lastEditElement) {
        lastEditElement.textContent = `Last edit: ${state.lastEditTimestamp.toLocaleString()}`;
      }

      // Update MongoDB status indicator
      const mongoStatus = document.getElementById('admin-mongo-status');
      if (mongoStatus && data.mongoSync) {
        mongoStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> MongoDB Synced';
      } else if (mongoStatus) {
        mongoStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span> MongoDB Not Synced';
      }

      // Show success message
      alert('Content updated successfully!');

      // Close editor
      closeEditor();
    })
    .catch(error => {
      console.error('Error saving changes:', error);
      alert('Error saving changes. Please try again.');
    });
  }

  // Logout
  function logout() {
    state.isAuthenticated = false;
    state.isEditMode = false;
    localStorage.removeItem(CONFIG.storageKey);

    // Remove admin bar
    const adminBar = document.getElementById('admin-bar');
    if (adminBar) {
      adminBar.remove();
      document.body.style.paddingTop = '0';
    }

    // Remove editable styles
    disableEditableElements();

    // Remove editor if open
    closeEditor();
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
