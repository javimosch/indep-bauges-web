/**
 * Admin Script/Style Injections Manager
 * Provides UI for managing global script and style injections for the site
 */

(function() {
  // Configuration
  const CONFIG = {
    injectionsEndpoint: '/api/injections',
    storageKey: 'admin_auth_token',
    adminNameKey: 'admin_name'
  };

  // State
  let state = {
    injections: [],
    isLoading: false,
    currentInjection: null,
    isEditing: false
  };

  // Helper modules
  const { Toast, Storage } = window.AdminHelpers || {};

  // Initialize injections manager
  function init() {
    console.log('admin-injections.js init Initializing injections manager');
    // Setup event handlers
    document.addEventListener('click', function(e) {
      if (e.target.id === 'admin-manage-injections') {
        showInjectionsManager();
      } else if (e.target.id === 'injections-add-new') {
        showInjectionEditor();
      } else if (e.target.id === 'injections-save') {
        saveInjection();
      } else if (e.target.id === 'injections-close-editor') {
        closeInjectionEditor();
      } else if (e.target.id === 'injections-close-manager') {
        closeInjectionsManager();
      } else if (e.target.classList.contains('injection-edit-btn')) {
        const injectionId = e.target.dataset.id;
        editInjection(injectionId);
      } else if (e.target.classList.contains('injection-delete-btn')) {
        const injectionId = e.target.dataset.id;
        deleteInjection(injectionId);
      } else if (e.target.classList.contains('injection-toggle-btn')) {
        const injectionId = e.target.dataset.id;
        toggleInjectionStatus(injectionId);
      }
    });
  }

  // Show injections manager
  function showInjectionsManager() {
    console.log('admin-injections.js showInjectionsManager Showing injections manager');
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('injections-manager-modal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'injections-manager-modal';
      modal.className = 'fixed inset-0 flex items-center justify-center z-50';
      
      modal.innerHTML = `
        <div class="absolute inset-0 bg-black bg-opacity-50"></div>
        <div class="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] z-10 overflow-hidden flex flex-col">
          <div class="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
            <h3 class="text-xl font-bold">Script & Style Injections Manager</h3>
            <button id="injections-close-manager" class="text-white hover:text-gray-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="px-6 py-4 overflow-y-auto flex-grow">
            <div class="flex justify-between items-center mb-4">
              <div class="text-sm text-gray-500">
                Manage scripts and styles that will be injected into your site.
              </div>
              <button id="injections-add-new" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
                Add New Injection
              </button>
            </div>
            <div id="injections-list" class="mt-4">
              <div class="text-center py-12 text-gray-500">Loading injections...</div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    }
    
    // Load injections
    loadInjections();
  }

  // Load injections
  async function loadInjections() {
    console.log('admin-injections.js loadInjections Loading injections');
    
    try {
      state.isLoading = true;
      updateInjectionsTable();
      
      const authData = Storage.get(CONFIG.storageKey);
      
      if (!authData || !authData.token) {
        Toast.show('Authentication required', 'error');
        return;
      }
      
      const response = await fetch(CONFIG.injectionsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        state.injections = result.data;
      } else {
        Toast.show(result.message || 'Failed to load injections', 'error');
      }
    } catch (err) {
      console.log('admin-injections.js loadInjections Error loading injections', {message: err.message, stack: err.stack});
      Toast.show('Error loading injections', 'error');
    } finally {
      state.isLoading = false;
      updateInjectionsTable();
    }
  }

  // Update injections table
  function updateInjectionsTable() {
    console.log('admin-injections.js updateInjectionsTable Updating injections table');
    
    const injectionsListEl = document.getElementById('injections-list');
    
    if (!injectionsListEl) return;
    
    if (state.isLoading) {
      injectionsListEl.innerHTML = `
        <div class="text-center py-12 text-gray-500">Loading injections...</div>
      `;
      return;
    }
    
    if (state.injections.length === 0) {
      injectionsListEl.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          No injections found. Click "Add New Injection" to create one.
        </div>
      `;
      return;
    }
    
    const tableHtml = `
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${state.injections.map(injection => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-medium text-gray-900">${injection.name}</div>
                <div class="text-sm text-gray-500">ID: ${injection.injectionId}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${injection.type === 'script' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}">
                  ${injection.type}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${injection.location}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${injection.origin === 'system' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                  ${injection.origin}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${injection.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                  ${injection.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  ${injection.origin === 'system' ? `
                    <button class="text-indigo-600 hover:text-indigo-900 cursor-not-allowed opacity-50" disabled title="System injections cannot be edited">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                    </button>
                  ` : `
                    <button class="text-indigo-600 hover:text-indigo-900 injection-edit-btn" data-id="${injection.injectionId}">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                    </button>
                  `}
                  <button class="text-indigo-600 hover:text-indigo-900 injection-toggle-btn" data-id="${injection.injectionId}">
                    ${injection.isActive ? `
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                      </svg>
                    ` : `
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    `}
                  </button>
                  ${injection.origin === 'system' ? `
                    <button class="text-red-600 hover:text-red-900 cursor-not-allowed opacity-50" disabled title="System injections cannot be deleted">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  ` : `
                    <button class="text-red-600 hover:text-red-900 injection-delete-btn" data-id="${injection.injectionId}">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  `}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    injectionsListEl.innerHTML = tableHtml;
  }

  // Show injection editor
  function showInjectionEditor(injection = null) {
    console.log('admin-injections.js showInjectionEditor Showing injection editor', {data: {injection}});
    
    state.currentInjection = injection;
    state.isEditing = !!injection;
    
    // Create editor modal if it doesn't exist
    let modal = document.getElementById('injection-editor-modal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'injection-editor-modal';
      modal.className = 'fixed inset-0 flex items-center justify-center z-50';
      
      modal.innerHTML = `
        <div class="absolute inset-0 bg-black bg-opacity-50"></div>
        <div class="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] z-10 overflow-hidden flex flex-col">
          <div class="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
            <h3 class="text-xl font-bold">
              <span id="editor-title">${state.isEditing ? 'Edit' : 'Add'} Injection</span>
            </h3>
            <button id="injections-close-editor" class="text-white hover:text-gray-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="px-6 py-4 overflow-y-auto">
            <form id="injection-form" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="injection-name" class="block text-sm font-medium text-gray-700">Name</label>
                  <input type="text" id="injection-name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                    value="${state.isEditing ? injection.name : ''}" placeholder="Analytics Script" required>
                </div>
                <div>
                  <label for="injection-type" class="block text-sm font-medium text-gray-700">Type</label>
                  <select id="injection-type" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
                    <option value="script" ${state.isEditing && injection.type === 'script' ? 'selected' : ''}>Script</option>
                    <option value="style" ${state.isEditing && injection.type === 'style' ? 'selected' : ''}>Style</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label for="injection-location" class="block text-sm font-medium text-gray-700">Injection Location</label>
                <select id="injection-location" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
                  <option value="before-body-close" ${!state.isEditing || (state.isEditing && injection.location === 'before-body-close') ? 'selected' : ''}>Before Body Close</option>
                  <option value="before-head-close" ${state.isEditing && injection.location === 'before-head-close' ? 'selected' : ''}>Before Head Close</option>
                </select>
              </div>
              
              <div>
                <label for="injection-code" class="block text-sm font-medium text-gray-700">Code</label>
                <textarea id="injection-code" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono h-64" 
                  placeholder="${state.currentInjection?.type === 'style' || document.getElementById('injection-type')?.value === 'style' ? 
                    '/* CSS styles */\nbody { background-color: #f0f0f0; }' : 
                    '// JavaScript code\nconsole.log("Hello from injected script!");'}" 
                  required>${state.isEditing ? injection.code : ''}</textarea>
              </div>
              
              <div class="flex justify-end">
                <button type="button" id="injections-close-editor" class="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2 hover:bg-gray-400 transition-colors">
                  Cancel
                </button>
                <button type="button" id="injections-save" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
                  Save Injection
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    } else {
      // Update existing modal
      const titleEl = document.getElementById('editor-title');
      const nameEl = document.getElementById('injection-name');
      const typeEl = document.getElementById('injection-type');
      const locationEl = document.getElementById('injection-location');
      const codeEl = document.getElementById('injection-code');
      
      if (titleEl) titleEl.textContent = `${state.isEditing ? 'Edit' : 'Add'} Injection`;
      if (nameEl) nameEl.value = state.isEditing ? injection.name : '';
      if (typeEl) typeEl.value = state.isEditing ? injection.type : 'script';
      if (locationEl) locationEl.value = state.isEditing ? injection.location : 'before-body-close';
      if (codeEl) codeEl.value = state.isEditing ? injection.code : '';
      
      // Show the modal
      modal.style.display = 'flex';
    }
    
    // Setup type change handler to update placeholder
    const typeEl = document.getElementById('injection-type');
    const codeEl = document.getElementById('injection-code');
    
    if (typeEl && codeEl) {
      typeEl.addEventListener('change', function() {
        if (codeEl.value === '') { // Only update if empty
          if (typeEl.value === 'script') {
            codeEl.placeholder = '// JavaScript code\nconsole.log("Hello from injected script!");';
          } else {
            codeEl.placeholder = '/* CSS styles */\nbody { background-color: #f0f0f0; }';
          }
        }
      });
    }
  }

  // Close injection editor
  function closeInjectionEditor() {
    console.log('admin-injections.js closeInjectionEditor Closing injection editor');
    
    const modal = document.getElementById('injection-editor-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    
    state.currentInjection = null;
    state.isEditing = false;
  }

  // Close injections manager
  function closeInjectionsManager() {
    console.log('admin-injections.js closeInjectionsManager Closing injections manager');
    
    const modal = document.getElementById('injections-manager-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    
    closeInjectionEditor();
  }

  // Save injection
  async function saveInjection() {
    console.log('admin-injections.js saveInjection Saving injection');
    
    const nameEl = document.getElementById('injection-name');
    const typeEl = document.getElementById('injection-type');
    const locationEl = document.getElementById('injection-location');
    const codeEl = document.getElementById('injection-code');
    
    if (!nameEl || !typeEl || !locationEl || !codeEl) {
      Toast.show('Error: Form elements not found', 'error');
      return;
    }
    
    const name = nameEl.value.trim();
    const type = typeEl.value;
    const location = locationEl.value;
    const code = codeEl.value;
    
    if (!name || !type || !location || !code) {
      Toast.show('All fields are required', 'warning');
      return;
    }
    
    try {
      const authData = Storage.get(CONFIG.storageKey);
      const adminName = Storage.get(CONFIG.adminNameKey) || 'unknown';
      
      if (!authData || !authData.token) {
        Toast.show('Authentication required', 'error');
        return;
      }
      
      let url = CONFIG.injectionsEndpoint;
      let method = 'POST';
      
      if (state.isEditing) {
        url = `${CONFIG.injectionsEndpoint}/${state.currentInjection.injectionId}`;
        method = 'PUT';
      }
      
      const data = {
        name,
        type,
        code,
        location,
        adminName
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        Toast.show(`Injection ${state.isEditing ? 'updated' : 'created'} successfully`, 'success');
        closeInjectionEditor();
        loadInjections();
      } else {
        Toast.show(result.message || 'Failed to save injection', 'error');
      }
    } catch (err) {
      console.log(`admin-injections.js saveInjection Error saving injection`, {message: err.message, stack: err.stack});
      Toast.show('Error saving injection', 'error');
    }
  }

  // Edit injection
  function editInjection(injectionId) {
    console.log('admin-injections.js editInjection Editing injection', {data: {injectionId}});
    
    const injection = state.injections.find(inj => inj.injectionId === injectionId);
    
    if (injection) {
      showInjectionEditor(injection);
    } else {
      Toast.show('Injection not found', 'error');
    }
  }

  // Delete injection
  async function deleteInjection(injectionId) {
    console.log('admin-injections.js deleteInjection Deleting injection', {data: {injectionId}});
    
    if (!confirm('Are you sure you want to delete this injection? This action cannot be undone.')) {
      return;
    }
    
    try {
      const authData = Storage.get(CONFIG.storageKey);
      
      if (!authData || !authData.token) {
        Toast.show('Authentication required', 'error');
        return;
      }
      
      const response = await fetch(`${CONFIG.injectionsEndpoint}/${injectionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        Toast.show('Injection deleted successfully', 'success');
        loadInjections();
      } else {
        Toast.show(result.message || 'Failed to delete injection', 'error');
      }
    } catch (err) {
      console.log(`admin-injections.js deleteInjection Error deleting injection`, {message: err.message, stack: err.stack});
      Toast.show('Error deleting injection', 'error');
    }
  }

  // Toggle injection status
  async function toggleInjectionStatus(injectionId) {
    console.log('admin-injections.js toggleInjectionStatus Toggling injection status', {data: {injectionId}});
    
    try {
      const injection = state.injections.find(inj => inj.injectionId === injectionId);
      
      if (!injection) {
        Toast.show('Injection not found', 'error');
        return;
      }
      
      const authData = Storage.get(CONFIG.storageKey);
      const adminName = Storage.get(CONFIG.adminNameKey) || 'unknown';
      
      if (!authData || !authData.token) {
        Toast.show('Authentication required', 'error');
        return;
      }
      
      const response = await fetch(`${CONFIG.injectionsEndpoint}/${injectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          isActive: !injection.isActive,
          adminName
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        Toast.show(`Injection ${injection.isActive ? 'deactivated' : 'activated'} successfully`, 'success');
        loadInjections();
      } else {
        Toast.show(result.message || 'Failed to update injection status', 'error');
      }
    } catch (err) {
      console.log(`admin-injections.js toggleInjectionStatus Error toggling injection status`, {message: err.message, stack: err.stack});
      Toast.show('Error updating injection status', 'error');
    }
  }

  // Export the API
  window.AdminInjections = {
    init,
    showInjectionsManager
  };

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
