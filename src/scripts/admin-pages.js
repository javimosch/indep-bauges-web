/**
 * Admin page management interface
 */

class AdminPageManager {
  constructor() {
    this.currentPage = null;
    this.templates = [];
    this.layouts = [];
    this.init();
  }
  
  async init() {
    // Load templates and layouts
    await this.loadTemplatesAndLayouts();
    
    // Initialize page management interface
    this.initPageInterface();
    
    // Load pages list
    this.loadPages();
  }
  
  async loadTemplatesAndLayouts() {
    try {
      const response = await fetch('/api/admin/pages/meta/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.templates = data.templates;
        this.layouts = data.layouts;
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }
  
  initPageInterface() {
    // Add page management button to admin interface
    if (window.adminHelpers && window.adminHelpers.isAdminMode()) {
      this.addPageManagementButton();
    }
  }
  
  addPageManagementButton() {
    // Check if button already exists
    if (document.getElementById('admin-pages-btn')) return;
    
    // Find admin toolbar or create one
    let toolbar = document.querySelector('.admin-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'admin-toolbar fixed top-4 right-4 z-50 flex gap-2';
      document.body.appendChild(toolbar);
    }
    
    // Add page management button
    const pageBtn = document.createElement('button');
    pageBtn.id = 'admin-pages-btn';
    pageBtn.className = 'btn btn-primary btn-sm';
    pageBtn.innerHTML = '<i class="fas fa-file-alt mr-1"></i> Pages';
    pageBtn.onclick = () => this.showPageManager();
    
    toolbar.appendChild(pageBtn);
  }
  
  showPageManager() {
    // Create modal
    const modal = this.createModal('page-manager', 'Page Management', this.createPageManagerContent());
    document.body.appendChild(modal);
    
    // Show modal
    modal.showModal();
    
    // Load pages
    this.loadPages();
  }
  
  createModal(id, title, content) {
    const modal = document.createElement('dialog');
    modal.id = id;
    modal.className = 'modal';
    
    modal.innerHTML = `
      <div class="modal-box w-11/12 max-w-6xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-lg">${title}</h3>
          <button class="btn btn-sm btn-circle btn-ghost" onclick="this.closest('dialog').close()">✕</button>
        </div>
        <div class="modal-content">
          ${content}
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    `;
    
    return modal;
  }
  
  createPageManagerContent() {
    return `
      <div class="flex gap-4 mb-4">
        <button class="btn btn-primary" onclick="adminPageManager.showCreatePage()">
          <i class="fas fa-plus mr-2"></i>Create New Page
        </button>
        <div class="flex gap-2">
          <select id="status-filter" class="select select-bordered select-sm" onchange="adminPageManager.loadPages()">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <input type="text" id="search-pages" placeholder="Search pages..." 
                 class="input input-bordered input-sm" 
                 onkeyup="adminPageManager.searchPages(event)">
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Author</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="pages-table-body">
            <tr>
              <td colspan="6" class="text-center">Loading pages...</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
  
  async loadPages() {
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const searchTerm = document.getElementById('search-pages')?.value || '';
    
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/pages?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.renderPagesTable(data.pages);
      } else {
        throw new Error('Failed to load pages');
      }
    } catch (error) {
      console.error('Error loading pages:', error);
      this.showError('Failed to load pages');
    }
  }
  
  renderPagesTable(pages) {
    const tbody = document.getElementById('pages-table-body');
    if (!tbody) return;
    
    if (pages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No pages found</td></tr>';
      return;
    }
    
    tbody.innerHTML = pages.map(page => `
      <tr>
        <td>
          <div class="font-medium">${page.title}</div>
          ${page.settings.showInNavigation ? '<span class="badge badge-sm badge-info">In Navigation</span>' : ''}
        </td>
        <td>
          <code class="text-sm">/${page.slug}</code>
          <a href="/${page.slug}" target="_blank" class="btn btn-xs btn-ghost ml-2">
            <i class="fas fa-external-link-alt"></i>
          </a>
        </td>
        <td>
          <span class="badge ${this.getStatusBadgeClass(page.status)}">${page.status}</span>
        </td>
        <td>${page.author}</td>
        <td>${new Date(page.updatedAt).toLocaleDateString()}</td>
        <td>
          <div class="flex gap-1">
            <button class="btn btn-xs btn-primary" onclick="adminPageManager.editPage('${page._id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-xs btn-secondary" onclick="adminPageManager.duplicatePage('${page._id}')">
              <i class="fas fa-copy"></i>
            </button>
            <button class="btn btn-xs btn-error" onclick="adminPageManager.deletePage('${page._id}', '${page.title}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  getStatusBadgeClass(status) {
    switch (status) {
      case 'published': return 'badge-success';
      case 'draft': return 'badge-warning';
      case 'archived': return 'badge-neutral';
      default: return 'badge-ghost';
    }
  }
  
  searchPages(event) {
    // Debounce search
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadPages();
    }, 300);
  }
  
  showCreatePage() {
    this.currentPage = null;
    this.showPageEditor();
  }
  
  async editPage(pageId) {
    try {
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.currentPage = data.page;
        this.showPageEditor();
      } else {
        throw new Error('Failed to load page');
      }
    } catch (error) {
      console.error('Error loading page:', error);
      this.showError('Failed to load page');
    }
  }
  
  showPageEditor() {
    const isEdit = !!this.currentPage;
    const title = isEdit ? 'Edit Page' : 'Create New Page';
    
    const modal = this.createModal('page-editor', title, this.createPageEditorContent());
    document.body.appendChild(modal);
    modal.showModal();
    
    // Populate form if editing
    if (isEdit) {
      this.populatePageForm();
    }
  }
  
  createPageEditorContent() {
    const isEdit = !!this.currentPage;
    
    return `
      <form id="page-form" onsubmit="adminPageManager.savePage(event)">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Title *</span>
            </label>
            <input type="text" id="page-title" name="title" required 
                   class="input input-bordered" placeholder="Page title">
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Slug *</span>
            </label>
            <input type="text" id="page-slug" name="slug" required 
                   class="input input-bordered" placeholder="page-url-slug"
                   ${isEdit ? 'readonly' : ''}>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Template</span>
            </label>
            <select id="page-template" name="template" class="select select-bordered">
              ${this.templates.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Layout</span>
            </label>
            <select id="page-layout" name="layout" class="select select-bordered">
              ${this.layouts.map(l => `<option value="${l.value}">${l.label}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Status</span>
            </label>
            <select id="page-status" name="status" class="select select-bordered">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Meta Description</span>
          </label>
          <textarea id="page-description" name="description" 
                    class="textarea textarea-bordered" rows="2"
                    placeholder="SEO description (max 160 characters)"></textarea>
        </div>
        
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Content *</span>
          </label>
          <textarea id="page-content" name="content" required 
                    class="textarea textarea-bordered" rows="10"
                    placeholder="Page content (HTML allowed)"></textarea>
        </div>
        
        <div class="form-control mb-4">
          <label class="cursor-pointer label">
            <span class="label-text">Show in Navigation</span>
            <input type="checkbox" id="page-navigation" name="showInNavigation" class="checkbox">
          </label>
        </div>
        
        <div class="modal-action">
          <button type="button" class="btn" onclick="this.closest('dialog').close()">Cancel</button>
          <button type="submit" class="btn btn-primary">
            ${isEdit ? 'Update Page' : 'Create Page'}
          </button>
        </div>
      </form>
    `;
  }
  
  populatePageForm() {
    if (!this.currentPage) return;
    
    document.getElementById('page-title').value = this.currentPage.title;
    document.getElementById('page-slug').value = this.currentPage.slug;
    document.getElementById('page-template').value = this.currentPage.template;
    document.getElementById('page-layout').value = this.currentPage.layout;
    document.getElementById('page-status').value = this.currentPage.status;
    document.getElementById('page-description').value = this.currentPage.meta?.description || '';
    document.getElementById('page-content').value = this.currentPage.content;
    document.getElementById('page-navigation').checked = this.currentPage.settings?.showInNavigation || false;
  }
  
  async savePage(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const pageData = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      content: formData.get('content'),
      template: formData.get('template'),
      layout: formData.get('layout'),
      status: formData.get('status'),
      meta: {
        description: formData.get('description')
      },
      settings: {
        showInNavigation: formData.has('showInNavigation')
      }
    };
    
    try {
      const isEdit = !!this.currentPage;
      const url = isEdit ? `/api/admin/pages/${this.currentPage._id}` : '/api/admin/pages';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(pageData)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.showSuccess(data.message);
        
        // Close editor and refresh list
        document.getElementById('page-editor').close();
        this.loadPages();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error saving page:', error);
      this.showError(error.message || 'Failed to save page');
    }
  }
  
  async duplicatePage(pageId) {
    if (!confirm('Are you sure you want to duplicate this page?')) return;
    
    try {
      const response = await fetch(`/api/admin/pages/${pageId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.showSuccess(data.message);
        this.loadPages();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error duplicating page:', error);
      this.showError('Failed to duplicate page');
    }
  }
  
  async deletePage(pageId, pageTitle) {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"? This action cannot be undone.`)) return;
    
    try {
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.showSuccess(data.message);
        this.loadPages();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      this.showError('Failed to delete page');
    }
  }
  
  showSuccess(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'alert alert-success fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-auto';
    toast.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
  
  showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'alert alert-error fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-auto';
    toast.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
}

// Auto-generate slug from title
document.addEventListener('DOMContentLoaded', function() {
  const titleInput = document.getElementById('page-title');
  const slugInput = document.getElementById('page-slug');
  
  if (titleInput && slugInput && !slugInput.readOnly) {
    titleInput.addEventListener('input', function() {
      const slug = this.value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      slugInput.value = slug;
    });
  }
});

// Initialize admin page manager
const adminPageManager = new AdminPageManager();