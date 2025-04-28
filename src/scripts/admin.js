/**
 * Admin Inline Editing Script
 *
 * This script provides inline editing capabilities for administrators.
 * It includes:
 * - Password protection via JWT authentication
 * - Inline editing of content elements (h1-h6, p, a, button)
 * - API endpoint handling for saving changes
 * - Admin navigation bar
 * - MongoDB integration for persisting changes
 *
 * Requires: admin-helpers.js
 */

(function() {
  // Configuration
  const CONFIG = {
    apiEndpoint: '/api/save-content',
    authEndpoint: '/api/auth',
    syncEndpoint: '/api/sync-from-mongo',
    editableSelectors: 'h1, h2, h3, h4, h5, h6, p, a, button',
    storageKey: 'admin_auth_token',
    adminNameKey: 'admin_name',
    authTokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    toastDuration: 3000, // Toast notification duration in ms
  };

  // Helper modules
  const { Toast, EditorStyles, Storage } = window.AdminHelpers || {};

  // State
  let state = {
    isAuthenticated: false,
    isEditMode: false,
    lastEditTimestamp: null,
    currentlyEditing: null,
    adminName: Storage.get(CONFIG.adminNameKey) || ''
  };

  // Initialize admin functionality
  function init() {
    // Check if helper modules are available
    if (!Toast || !EditorStyles || !Storage) {
      console.error('Admin helpers not loaded. Make sure admin-helpers.js is included before admin.js');
      return;
    }

    // Initialize toast system
    Toast.setup();

    // Check authentication and set up event listeners
    checkAuthentication();
    setupEventListeners();
  }

  // Check if user is already authenticated
  function checkAuthentication() {
    const authData = Storage.get(CONFIG.storageKey);

    if (authData && authData.token) {
      // Verify token with server
      fetch(CONFIG.authEndpoint + '/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          state.isAuthenticated = true;
          createAdminBar();
        } else {
          // Token invalid
          Storage.remove(CONFIG.storageKey);
        }
      })
      .catch(error => {
        console.error('Token verification error:', error);
        Storage.remove(CONFIG.storageKey);
      });
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
      } else if (e.target.id === 'admin-sync-from-mongo') {
        syncFromMongo();
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
          Storage.save(CONFIG.storageKey, {
            token: data.token
          }, CONFIG.authTokenExpiry);

          createAdminBar();
        } else {
          Toast.show('Authentication failed: ' + (data.message || 'Invalid password'), 'error');
        }
      })
      .catch(error => {
        console.error('Authentication error:', error);
        Toast.show('Authentication error. Please try again.', 'error');
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

    // Sync from MongoDB button
    const syncFromMongoBtn = document.createElement('button');
    syncFromMongoBtn.id = 'admin-sync-from-mongo';
    syncFromMongoBtn.className = 'px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 transition-colors';
    syncFromMongoBtn.textContent = 'Sync from MongoDB';
    rightControls.appendChild(syncFromMongoBtn);

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
      Storage.save(CONFIG.adminNameKey, state.adminName);
      Toast.show(`Name saved: ${state.adminName}`, 'success');
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
    EditorStyles.add();
  }

  // Disable editable elements
  function disableEditableElements() {
    const elements = document.querySelectorAll('.admin-editable');

    elements.forEach(element => {
      element.classList.remove('admin-editable');
      element.removeEventListener('click', handleEditableClick);
    });

    // Remove editable style
    EditorStyles.remove();
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
    const authData = Storage.get(CONFIG.storageKey) || {};
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
      Toast.show('Content updated successfully!', 'success');

      // Close editor
      closeEditor();
    })
    .catch(error => {
      console.error('Error saving changes:', error);
      Toast.show('Error saving changes. Please try again.', 'error');
    });
  }

  // Sync from MongoDB
  function syncFromMongo() {
    // Show confirmation dialog with warning
    const confirmMessage = 'WARNING: This will overwrite local files with content from MongoDB.\n\nAre you sure you know what you are doing?\n\nThis action cannot be undone.';

    if (confirm(confirmMessage)) {
      // Get auth token
      const authData = Storage.get(CONFIG.storageKey) || {};
      const token = authData.token || '';

      // Update MongoDB status indicator
      const mongoStatus = document.getElementById('admin-mongo-status');
      if (mongoStatus) {
        mongoStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Syncing...';
      }

      // Call the sync API
      fetch(CONFIG.syncEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
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
        // Update MongoDB status indicator
        if (mongoStatus) {
          if (data.success) {
            mongoStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> Sync Complete';
            Toast.show(`Successfully synced ${data.syncedFiles.length} files from MongoDB`, 'success');

            // Reload the page after a short delay to show the changes
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            mongoStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span> Sync Failed';
            Toast.show('Sync failed: ' + (data.message || 'Unknown error'), 'error');
          }
        }
      })
      .catch(error => {
        console.error('Error syncing from MongoDB:', error);

        // Update MongoDB status indicator
        if (mongoStatus) {
          mongoStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span> Sync Error';
        }

        Toast.show('Error syncing from MongoDB. Please try again.', 'error');
      });
    } else {
      Toast.show('Sync from MongoDB cancelled', 'info');
    }
  }

  // Logout
  function logout() {
    state.isAuthenticated = false;
    state.isEditMode = false;
    Storage.remove(CONFIG.storageKey);

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
