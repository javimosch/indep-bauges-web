/**
 * WordPress-style Admin Panel
 * Persistent lateral panel for admin functions
 */

class AdminPanel {
  constructor() {
    this.isOpen = false;
    this.currentComponent = 'dashboard';
    this.components = new Map();
    this.isAuthenticated = false;
    this.init();
  }
  
  async init() {
    // Check authentication
    this.checkAuthStatus();
    
    if (this.isAuthenticated) {
      await this.createPanel();
      this.initializeComponents();
      this.bindEvents();
      console.log('Admin panel initialized');
    }
  }
  
  checkAuthStatus() {
    try {
      const authData = JSON.parse(localStorage.getItem('admin_auth_token') || '{}');
      this.isAuthenticated = !!(authData.data?.token || authData.token);
      
      if (this.isAuthenticated) {
        console.log('Admin authenticated, loading panel...');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.isAuthenticated = false;
    }
  }
  
  getAdminToken() {
    try {
      const authData = JSON.parse(localStorage.getItem('admin_auth_token') || '{}');
      return authData.data?.token || authData.token || '';
    } catch (error) {
      console.error('Error getting admin token:', error);
      return '';
    }
  }
  
  initializeComponents() {
    // Initialize component registry
    this.components.set('dashboard', {
      name: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      loader: () => this.loadDashboard()
    });
    
    this.components.set('pages', {
      name: 'Pages',
      icon: 'fas fa-file-alt',
      loader: () => this.loadPages()
    });
    
    this.components.set('content', {
      name: 'Content',
      icon: 'fas fa-edit',
      loader: () => this.loadContent()
    });
    
    this.components.set('media', {
      name: 'Media',
      icon: 'fas fa-images',
      loader: () => this.loadMedia()
    });
    
    this.components.set('settings', {
      name: 'Settings',
      icon: 'fas fa-cog',
      loader: () => this.loadSettings()
    });
    
    // Load default component (dashboard)
    this.loadComponent('dashboard');
  }
  
  async createPanel() {
    // Remove existing panel if any
    const existingPanel = document.getElementById('admin-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // Create panel HTML
    const panelHTML = `
      <div id="admin-panel" class="admin-panel">
        <div class="admin-panel-header">
          <div class="admin-panel-logo">
            <div class="logo-icon">IB</div>
            <span class="logo-text">Admin</span>
          </div>
          <button id="admin-panel-close" class="admin-panel-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <nav class="admin-panel-nav">
          <ul class="admin-nav-menu">
            <li>
              <a href="#" data-component="dashboard" class="admin-nav-item active">
                <i class="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#" data-component="pages" class="admin-nav-item">
                <i class="fas fa-file-alt"></i>
                <span>Pages</span>
              </a>
            </li>
            <li>
              <a href="#" data-component="content" class="admin-nav-item">
                <i class="fas fa-edit"></i>
                <span>Content</span>
              </a>
            </li>
            <li>
              <a href="#" data-component="media" class="admin-nav-item">
                <i class="fas fa-images"></i>
                <span>Media</span>
              </a>
            </li>
            <li>
              <a href="#" data-component="settings" class="admin-nav-item">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <div class="admin-panel-content">
          <div id="admin-component-container">
            <!-- Component content will be loaded here -->
          </div>
        </div>
        
        <div class="admin-panel-footer">
          <div class="admin-user-info">
            <i class="fas fa-user-circle"></i>
            <span>Admin User</span>
          </div>
          <button id="admin-logout" class="admin-logout-btn">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      <div id="admin-panel-overlay" class="admin-panel-overlay"></div>
      
      <button id="admin-panel-toggle" class="admin-panel-toggle">
        <i class="fas fa-cog"></i>
      </button>
    `;
    
    // Add panel to body
    document.body.insertAdjacentHTML('beforeend', panelHTML);
    
    // Add styles
    this.addStyles();
  }
  
  addStyles() {
    if (document.getElementById('admin-panel-styles')) return;
    
    const styles = `
      <style id="admin-panel-styles">
        .admin-panel {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          width: 280px;
          background: #1e293b;
          color: white;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 10px rgba(0,0,0,0.3);
        }
        
        .admin-panel.open {
          transform: translateX(0);
        }
        
        .admin-panel-header {
          padding: 1rem;
          border-bottom: 1px solid #334155;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .admin-panel-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .logo-icon {
          width: 32px;
          height: 32px;
          background: #3b82f6;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }
        
        .logo-text {
          font-weight: bold;
          font-size: 18px;
        }
        
        .admin-panel-close {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .admin-panel-close:hover {
          background: #334155;
          color: white;
        }
        
        .admin-panel-nav {
          flex: 1;
          overflow-y: auto;
        }
        
        .admin-nav-menu {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: #94a3b8;
          text-decoration: none;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }
        
        .admin-nav-item:hover {
          background: #334155;
          color: white;
        }
        
        .admin-nav-item.active {
          background: #1e40af;
          color: white;
          border-left-color: #3b82f6;
        }
        
        .admin-nav-item i {
          width: 20px;
          text-align: center;
        }
        
        .admin-panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        
        .admin-panel-footer {
          padding: 1rem;
          border-top: 1px solid #334155;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
          font-size: 14px;
        }
        
        .admin-logout-btn {
          background: #dc2626;
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 12px;
          transition: background 0.2s;
        }
        
        .admin-logout-btn:hover {
          background: #b91c1c;
        }
        
        .admin-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.5);
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        
        .admin-panel-overlay.active {
          opacity: 1;
          visibility: visible;
        }
        
        .admin-panel-toggle {
          position: fixed;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: #3b82f6;
          border: none;
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10001;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .admin-panel-toggle:hover {
          background: #2563eb;
          transform: translateY(-50%) scale(1.1);
        }
        
        .admin-panel-toggle.hidden {
          opacity: 0;
          visibility: hidden;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .admin-panel {
            width: 100vw;
          }
        }
        
        /* Component styles */
        .admin-component {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1.5rem;
          color: #1e293b;
        }
        
        .admin-component h2 {
          margin: 0 0 1rem 0;
          color: #1e293b;
          font-size: 1.5rem;
        }
        
        .admin-component h3 {
          margin: 1.5rem 0 0.5rem 0;
          color: #475569;
          font-size: 1.1rem;
        }
        
        .admin-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .admin-stat-card {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .admin-stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1e293b;
        }
        
        .admin-stat-label {
          color: #64748b;
          font-size: 0.9rem;
        }
        
        .admin-quick-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .admin-quick-action {
          background: #3b82f6;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background 0.2s;
        }
        
        .admin-quick-action:hover {
          background: #2563eb;
          color: white;
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
  
  bindEvents() {
    // Toggle panel
    const toggleBtn = document.getElementById('admin-panel-toggle');
    const closeBtn = document.getElementById('admin-panel-close');
    const overlay = document.getElementById('admin-panel-overlay');
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }
    
    // Navigation
    const navItems = document.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const component = item.dataset.component;
        this.loadComponent(component);
        
        // Update active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
      });
    });
    
    // Logout
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        this.toggle();
      }
    });
  }
  
  toggle() {
    this.isOpen = !this.isOpen;
    this.updatePanelState();
  }
  
  open() {
    this.isOpen = true;
    this.updatePanelState();
  }
  
  close() {
    this.isOpen = false;
    this.updatePanelState();
  }
  
  updatePanelState() {
    const panel = document.getElementById('admin-panel');
    const overlay = document.getElementById('admin-panel-overlay');
    const toggle = document.getElementById('admin-panel-toggle');
    
    if (panel) {
      panel.classList.toggle('open', this.isOpen);
    }
    
    if (overlay) {
      overlay.classList.toggle('active', this.isOpen);
    }
    
    if (toggle) {
      toggle.classList.toggle('hidden', this.isOpen);
    }
  }
  
  async loadComponent(name) {
    this.currentComponent = name;
    const container = document.getElementById('admin-component-container');
    
    if (!container) return;
    
    // Show loading
    container.innerHTML = '<div class="admin-component"><p>Loading...</p></div>';
    
    try {
      const component = this.components.get(name);
      let content = '';
      
      if (component && component.loader) {
        content = await component.loader();
      } else {
        // Fallback for unknown components
        switch (name) {
          case 'dashboard':
            content = await this.loadDashboard();
            break;
          case 'pages':
            content = await this.loadPages();
            break;
          case 'content':
            content = await this.loadContent();
            break;
          case 'media':
            content = await this.loadMedia();
            break;
          case 'settings':
            content = await this.loadSettings();
            break;
          default:
            content = '<div class="admin-component"><h2>Component not found</h2></div>';
        }
      }
      
      container.innerHTML = content;
      
      // Initialize component-specific functionality
      this.initializeComponent(name);
      
    } catch (error) {
      console.error('Error loading component:', error);
      container.innerHTML = '<div class="admin-component"><h2>Error loading component</h2><p>' + error.message + '</p></div>';
    }
  }
  
  async loadDashboard() {
    try {
      // Get site statistics
      const response = await fetch('/api/admin/pages', {
        headers: {
          'Authorization': `Bearer ${this.getAdminToken()}`
        }
      });
      
      let stats = {
        totalPages: 0,
        publishedPages: 0,
        draftPages: 0
      };
      
      if (response.ok) {
        const data = await response.json();
        stats.totalPages = data.pages.length;
        stats.publishedPages = data.pages.filter(p => p.status === 'published').length;
        stats.draftPages = data.pages.filter(p => p.status === 'draft').length;
      }
      
      return `
        <div class="admin-component">
          <h2>Dashboard</h2>
          
          <div class="admin-stats">
            <div class="admin-stat-card">
              <div class="admin-stat-value">${stats.totalPages}</div>
              <div class="admin-stat-label">Total Pages</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-value">${stats.publishedPages}</div>
              <div class="admin-stat-label">Published Pages</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-value">${stats.draftPages}</div>
              <div class="admin-stat-label">Draft Pages</div>
            </div>
          </div>
          
          <h3>Quick Actions</h3>
          <div class="admin-quick-actions">
            <button class="admin-quick-action" onclick="adminPanel.loadComponent('pages')">
              <i class="fas fa-plus"></i>
              Create New Page
            </button>
            <button class="admin-quick-action" onclick="adminPanel.loadComponent('content')">
              <i class="fas fa-edit"></i>
              Edit Content
            </button>
            <a href="/" class="admin-quick-action" target="_blank">
              <i class="fas fa-external-link-alt"></i>
              View Site
            </a>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      return '<div class="admin-component"><h2>Dashboard</h2><p>Error loading dashboard data.</p></div>';
    }
  }
  
  async loadPages() {
    return `
      <div class="admin-component">
        <h2>Page Management</h2>
        <p>Loading page management interface...</p>
        <div id="pages-component-container"></div>
      </div>
    `;
  }
  
  async loadContent() {
    return `
      <div class="admin-component">
        <h2>Content Editor</h2>
        <p>Content editing interface will be available here.</p>
        <p>This will include:</p>
        <ul>
          <li>Rich text editor</li>
          <li>Media insertion</li>
          <li>Live preview</li>
          <li>Version history</li>
        </ul>
      </div>
    `;
  }
  
  async loadMedia() {
    return `
      <div class="admin-component">
        <h2>Media Library</h2>
        <p>Media management interface will be available here.</p>
        <p>This will include:</p>
        <ul>
          <li>File upload</li>
          <li>Image gallery</li>
          <li>File organization</li>
          <li>Media optimization</li>
        </ul>
      </div>
    `;
  }
  
  async loadSettings() {
    return `
      <div class="admin-component">
        <h2>Site Settings</h2>
        <p>Site configuration interface will be available here.</p>
        <p>This will include:</p>
        <ul>
          <li>Site information</li>
          <li>SEO settings</li>
          <li>User management</li>
          <li>System configuration</li>
        </ul>
      </div>
    `;
  }
  
  initializeComponent(name) {
    switch (name) {
      case 'pages':
        // Initialize the existing page manager in the panel
        if (window.adminPageManager) {
          const container = document.getElementById('pages-component-container');
          if (container) {
            // Create a simplified page manager interface for the panel
            container.innerHTML = `
              <button class="admin-quick-action" onclick="adminPageManager.showPageManager()">
                <i class="fas fa-external-link-alt"></i>
                Open Full Page Manager
              </button>
              <p class="mt-4">Or manage pages directly in the panel (coming soon).</p>
            `;
          }
        }
        break;
    }
  }
  
  logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('admin_auth_token');
      window.location.reload();
    }
  }
}

// Initialize admin panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.adminPanel = new AdminPanel();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
  });
} else {
  window.adminPanel = new AdminPanel();
}