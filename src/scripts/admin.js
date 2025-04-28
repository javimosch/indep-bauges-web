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
    auditEndpoint: '/api/audit-logs',
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
    adminName: Storage.get(CONFIG.adminNameKey) || '',
    auditLogs: {
      logs: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
      },
      filters: {
        adminNames: [],
        elementTypes: [],
        filenames: []
      },
      isLoading: false,
      currentFilter: {}
    }
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

    // Listen for edit mode toggle and other button clicks
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
      } else if (e.target.id === 'admin-view-audit') {
        showAuditHistory();
      } else if (e.target.id === 'audit-apply-filters') {
        applyAuditFilters();
      } else if (e.target.id === 'audit-reset-filters') {
        resetAuditFilters();
      }

      // Handle pagination clicks
      if (e.target.classList.contains('audit-page-btn')) {
        const page = parseInt(e.target.dataset.page);
        if (!isNaN(page)) {
          loadAuditLogs(page);
        }
      }
    });

    // Add separate event listeners for modal close
    document.addEventListener('click', function(e) {
      // Check if the click is on the backdrop or close button
      if (e.target.id === 'audit-modal-backdrop') {
        closeAuditModal();
      }
    });

    // Add event listener for the close button
    document.addEventListener('click', function(e) {
      if (e.target.closest('#audit-modal-close')) {
        closeAuditModal();
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
    adminNameLabel.className = 'text-sm text-gray-300 flex items-center';
    adminNameLabel.innerHTML = 'Your name: <span class="text-red-400 ml-1">*</span>';
    adminNameContainer.appendChild(adminNameLabel);

    const adminNameInput = document.createElement('input');
    adminNameInput.id = 'admin-name-input';
    adminNameInput.type = 'text';
    adminNameInput.className = 'px-2 py-1 rounded text-sm bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
    adminNameInput.placeholder = 'Enter your name';
    adminNameInput.value = state.adminName;
    adminNameInput.required = true;
    adminNameInput.setAttribute('aria-required', 'true');

    // Add event listener for Enter key
    adminNameInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        saveAdminName();
      }
    });

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

    // View Audit History button
    const viewAuditBtn = document.createElement('button');
    viewAuditBtn.id = 'admin-view-audit';
    viewAuditBtn.className = 'px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 transition-colors';
    viewAuditBtn.textContent = 'Audit History';
    rightControls.appendChild(viewAuditBtn);

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
    // Check if admin name is set
    if (!state.adminName.trim() && !state.isEditMode) {
      // Show warning and focus the name input
      Toast.show('Please enter your name before enabling edit mode', 'error');

      const nameInput = document.getElementById('admin-name-input');
      if (nameInput) {
        nameInput.focus();
        nameInput.classList.add('border-red-500', 'ring-red-500');

        // Remove highlight after a delay
        setTimeout(() => {
          nameInput.classList.remove('border-red-500', 'ring-red-500');
        }, 3000);
      }

      return;
    }

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
    // Check if admin name is set
    if (!state.adminName.trim()) {
      // Show warning and focus the name input
      Toast.show('Please enter your name before saving changes', 'error');

      // Close editor
      closeEditor();

      const nameInput = document.getElementById('admin-name-input');
      if (nameInput) {
        nameInput.focus();
        nameInput.classList.add('border-red-500', 'ring-red-500');

        // Remove highlight after a delay
        setTimeout(() => {
          nameInput.classList.remove('border-red-500', 'ring-red-500');
        }, 3000);
      }

      return;
    }

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
        adminName: state.adminName
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
    // Check if admin name is set
    if (!state.adminName.trim()) {
      // Show warning and focus the name input
      Toast.show('Please enter your name before syncing from MongoDB', 'error');

      const nameInput = document.getElementById('admin-name-input');
      if (nameInput) {
        nameInput.focus();
        nameInput.classList.add('border-red-500', 'ring-red-500');

        // Remove highlight after a delay
        setTimeout(() => {
          nameInput.classList.remove('border-red-500', 'ring-red-500');
        }, 3000);
      }

      return;
    }

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
          adminName: state.adminName
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

  // Show audit history modal
  function showAuditHistory() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('audit-modal');
    if (!modal) {
      modal = createAuditModal();
    }

    // Show modal
    modal.classList.remove('hidden');

    // Load audit logs
    loadAuditLogs();
  }

  // Create audit modal
  function createAuditModal() {
    const modal = document.createElement('div');
    modal.id = 'audit-modal';
    modal.className = 'fixed inset-0 z-[10000] overflow-y-auto hidden';

    // Modal HTML structure
    modal.innerHTML = `
      <div id="audit-modal-backdrop" class="fixed inset-0 bg-black bg-opacity-50"></div>
      <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-800">Audit History</h2>
            <button type="button" id="audit-modal-close" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Filters -->
          <div class="bg-gray-50 px-6 py-4 border-b">
            <div class="flex flex-wrap gap-4">
              <div class="flex-1 min-w-[200px]">
                <label class="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                <select id="audit-filter-admin" class="w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="">All Admins</option>
                </select>
              </div>
              <div class="flex-1 min-w-[200px]">
                <label class="block text-sm font-medium text-gray-700 mb-1">Element Type</label>
                <select id="audit-filter-type" class="w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="">All Types</option>
                </select>
              </div>
              <div class="flex-1 min-w-[200px]">
                <label class="block text-sm font-medium text-gray-700 mb-1">File</label>
                <select id="audit-filter-file" class="w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="">All Files</option>
                </select>
              </div>
              <div class="flex-1 min-w-[200px]">
                <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div class="flex gap-2">
                  <input type="date" id="audit-filter-start-date" class="flex-1 rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="From">
                  <input type="date" id="audit-filter-end-date" class="flex-1 rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="To">
                </div>
              </div>
            </div>
            <div class="flex justify-end mt-4 gap-2">
              <button id="audit-reset-filters" class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors">Reset Filters</button>
              <button id="audit-apply-filters" class="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 transition-colors text-white">Apply Filters</button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-auto p-6">
            <div id="audit-loading" class="flex justify-center items-center py-12 hidden">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>

            <div id="audit-empty" class="text-center py-12 text-gray-500 hidden">
              No audit logs found.
            </div>

            <div id="audit-error" class="text-center py-12 text-red-500 hidden">
              Error loading audit logs. Please try again.
            </div>

            <div id="audit-content">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Element</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
                  </tr>
                </thead>
                <tbody id="audit-table-body" class="bg-white divide-y divide-gray-200">
                  <!-- Audit logs will be inserted here -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pagination -->
          <div class="bg-gray-50 px-6 py-4 border-t">
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-700" id="audit-pagination-info">
                Showing <span id="audit-page-start">0</span> to <span id="audit-page-end">0</span> of <span id="audit-total">0</span> results
              </div>
              <div class="flex gap-2" id="audit-pagination-controls">
                <!-- Pagination buttons will be inserted here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  // Close audit modal
  function closeAuditModal() {
    const modal = document.getElementById('audit-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Load audit logs
  function loadAuditLogs(page = 1) {
    // Show loading state
    const loadingEl = document.getElementById('audit-loading');
    const contentEl = document.getElementById('audit-content');
    const emptyEl = document.getElementById('audit-empty');
    const errorEl = document.getElementById('audit-error');

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (contentEl) contentEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');

    // Update state
    state.auditLogs.isLoading = true;
    state.auditLogs.pagination.page = page;

    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', state.auditLogs.pagination.limit);

    // Add filters
    Object.entries(state.auditLogs.currentFilter).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    // Get auth token
    const authData = Storage.get(CONFIG.storageKey) || {};
    const token = authData.token || '';

    // Fetch audit logs
    fetch(`${CONFIG.auditEndpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Update state
      state.auditLogs.isLoading = false;

      if (data.success) {
        state.auditLogs.logs = data.data.logs;
        state.auditLogs.pagination = data.data.pagination;
        state.auditLogs.filters = data.data.filters;

        // Update UI
        updateAuditTable();
        updateAuditFilters();
        updateAuditPagination();

        // Show content or empty state
        if (state.auditLogs.logs.length > 0) {
          if (contentEl) contentEl.classList.remove('hidden');
        } else {
          if (emptyEl) emptyEl.classList.remove('hidden');
        }
      } else {
        // Show error
        if (errorEl) {
          errorEl.textContent = data.message || 'Error loading audit logs';
          errorEl.classList.remove('hidden');
        }
      }
    })
    .catch(error => {
      console.error('Error loading audit logs:', error);

      // Update state
      state.auditLogs.isLoading = false;

      // Show error
      if (errorEl) {
        errorEl.textContent = 'Error loading audit logs. Please try again.';
        errorEl.classList.remove('hidden');
      }
    })
    .finally(() => {
      // Hide loading
      if (loadingEl) loadingEl.classList.add('hidden');
    });
  }

  // Update audit table
  function updateAuditTable() {
    const tableBody = document.getElementById('audit-table-body');
    if (!tableBody) return;

    // Clear table
    tableBody.innerHTML = '';

    // Add rows
    state.auditLogs.logs.forEach(log => {
      const row = document.createElement('tr');

      // Format timestamp
      const timestamp = new Date(log.timestamp).toLocaleString();

      // Create content diff preview
      let contentDiff = '';
      if (log.elementType === 'system') {
        contentDiff = `<span class="text-gray-600">${log.newContent}</span>`;
      } else {
        // Truncate content for display
        const oldContent = log.previousContent ? truncateHTML(log.previousContent, 50) : '';
        const newContent = truncateHTML(log.newContent, 50);

        contentDiff = `
          <div class="flex flex-col gap-1">
            ${oldContent ? `<div class="text-red-600 line-through text-xs">${oldContent}</div>` : ''}
            <div class="text-green-600 text-xs">${newContent}</div>
          </div>
        `;
      }

      // Build row HTML
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${timestamp}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${log.adminName || 'Unknown'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${log.filename}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${log.elementType} ${log.elementId ? `(${log.elementId})` : ''}</td>
        <td class="px-6 py-4 text-sm text-gray-500">${contentDiff}</td>
      `;

      tableBody.appendChild(row);
    });

    // Update pagination info
    const start = (state.auditLogs.pagination.page - 1) * state.auditLogs.pagination.limit + 1;
    const end = Math.min(start + state.auditLogs.logs.length - 1, state.auditLogs.pagination.total);

    const startEl = document.getElementById('audit-page-start');
    const endEl = document.getElementById('audit-page-end');
    const totalEl = document.getElementById('audit-total');

    if (startEl) startEl.textContent = state.auditLogs.logs.length > 0 ? start : 0;
    if (endEl) endEl.textContent = state.auditLogs.logs.length > 0 ? end : 0;
    if (totalEl) totalEl.textContent = state.auditLogs.pagination.total;
  }

  // Update audit filters
  function updateAuditFilters() {
    // Update admin filter
    const adminFilter = document.getElementById('audit-filter-admin');
    if (adminFilter) {
      // Save selected value
      const selectedValue = adminFilter.value;

      // Clear options
      adminFilter.innerHTML = '<option value="">All Admins</option>';

      // Add options
      state.auditLogs.filters.adminNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        option.selected = name === selectedValue;
        adminFilter.appendChild(option);
      });
    }

    // Update element type filter
    const typeFilter = document.getElementById('audit-filter-type');
    if (typeFilter) {
      // Save selected value
      const selectedValue = typeFilter.value;

      // Clear options
      typeFilter.innerHTML = '<option value="">All Types</option>';

      // Add options
      state.auditLogs.filters.elementTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        option.selected = type === selectedValue;
        typeFilter.appendChild(option);
      });
    }

    // Update file filter
    const fileFilter = document.getElementById('audit-filter-file');
    if (fileFilter) {
      // Save selected value
      const selectedValue = fileFilter.value;

      // Clear options
      fileFilter.innerHTML = '<option value="">All Files</option>';

      // Add options
      state.auditLogs.filters.filenames.forEach(filename => {
        const option = document.createElement('option');
        option.value = filename;
        option.textContent = filename;
        option.selected = filename === selectedValue;
        fileFilter.appendChild(option);
      });
    }

    // Update date filters
    const startDateFilter = document.getElementById('audit-filter-start-date');
    const endDateFilter = document.getElementById('audit-filter-end-date');

    if (startDateFilter && state.auditLogs.currentFilter.startDate) {
      startDateFilter.value = state.auditLogs.currentFilter.startDate;
    }

    if (endDateFilter && state.auditLogs.currentFilter.endDate) {
      endDateFilter.value = state.auditLogs.currentFilter.endDate;
    }
  }

  // Update audit pagination
  function updateAuditPagination() {
    const paginationControls = document.getElementById('audit-pagination-controls');
    if (!paginationControls) return;

    // Clear pagination controls
    paginationControls.innerHTML = '';

    // Don't show pagination if there's only one page
    if (state.auditLogs.pagination.pages <= 1) return;

    // Add previous button
    if (state.auditLogs.pagination.page > 1) {
      const prevButton = document.createElement('button');
      prevButton.className = 'audit-page-btn px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors';
      prevButton.dataset.page = state.auditLogs.pagination.page - 1;
      prevButton.innerHTML = '&laquo; Prev';
      paginationControls.appendChild(prevButton);
    }

    // Add page buttons
    const maxButtons = 5;
    const halfButtons = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, state.auditLogs.pagination.page - halfButtons);
    let endPage = Math.min(state.auditLogs.pagination.pages, startPage + maxButtons - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    // Add first page button if not included
    if (startPage > 1) {
      const firstButton = document.createElement('button');
      firstButton.className = 'audit-page-btn px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors';
      firstButton.dataset.page = 1;
      firstButton.textContent = '1';
      paginationControls.appendChild(firstButton);

      // Add ellipsis if needed
      if (startPage > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'px-2 py-1';
        ellipsis.textContent = '...';
        paginationControls.appendChild(ellipsis);
      }
    }

    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement('button');
      pageButton.className = `audit-page-btn px-3 py-1 rounded transition-colors ${
        i === state.auditLogs.pagination.page
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-200 hover:bg-gray-300'
      }`;
      pageButton.dataset.page = i;
      pageButton.textContent = i;
      paginationControls.appendChild(pageButton);
    }

    // Add last page button if not included
    if (endPage < state.auditLogs.pagination.pages) {
      // Add ellipsis if needed
      if (endPage < state.auditLogs.pagination.pages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'px-2 py-1';
        ellipsis.textContent = '...';
        paginationControls.appendChild(ellipsis);
      }

      const lastButton = document.createElement('button');
      lastButton.className = 'audit-page-btn px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors';
      lastButton.dataset.page = state.auditLogs.pagination.pages;
      lastButton.textContent = state.auditLogs.pagination.pages;
      paginationControls.appendChild(lastButton);
    }

    // Add next button
    if (state.auditLogs.pagination.page < state.auditLogs.pagination.pages) {
      const nextButton = document.createElement('button');
      nextButton.className = 'audit-page-btn px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors';
      nextButton.dataset.page = state.auditLogs.pagination.page + 1;
      nextButton.innerHTML = 'Next &raquo;';
      paginationControls.appendChild(nextButton);
    }
  }

  // Apply audit filters
  function applyAuditFilters() {
    // Get filter values
    const adminFilter = document.getElementById('audit-filter-admin');
    const typeFilter = document.getElementById('audit-filter-type');
    const fileFilter = document.getElementById('audit-filter-file');
    const startDateFilter = document.getElementById('audit-filter-start-date');
    const endDateFilter = document.getElementById('audit-filter-end-date');

    // Update filter state
    state.auditLogs.currentFilter = {
      adminName: adminFilter ? adminFilter.value : '',
      elementType: typeFilter ? typeFilter.value : '',
      filename: fileFilter ? fileFilter.value : '',
      startDate: startDateFilter ? startDateFilter.value : '',
      endDate: endDateFilter ? endDateFilter.value : ''
    };

    // Reset to first page
    loadAuditLogs(1);
  }

  // Reset audit filters
  function resetAuditFilters() {
    // Clear filter inputs
    const adminFilter = document.getElementById('audit-filter-admin');
    const typeFilter = document.getElementById('audit-filter-type');
    const fileFilter = document.getElementById('audit-filter-file');
    const startDateFilter = document.getElementById('audit-filter-start-date');
    const endDateFilter = document.getElementById('audit-filter-end-date');

    if (adminFilter) adminFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (fileFilter) fileFilter.value = '';
    if (startDateFilter) startDateFilter.value = '';
    if (endDateFilter) endDateFilter.value = '';

    // Reset filter state
    state.auditLogs.currentFilter = {};

    // Reload logs
    loadAuditLogs(1);
  }

  // Helper function to truncate HTML content
  function truncateHTML(html, maxLength) {
    if (!html) return '';

    // Create temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Get text content
    const text = tempDiv.textContent || tempDiv.innerText || '';

    // Truncate text
    if (text.length <= maxLength) {
      return html;
    }

    return text.substring(0, maxLength) + '...';
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
