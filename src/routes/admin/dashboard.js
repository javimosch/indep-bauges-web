/**
 * Admin Dashboard Routes
 * WordPress-style admin interface at /admin
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth.middleware');
const Page = require('../../models/Page');

// Admin dashboard home
router.get('/', async (req, res) => {
  try {
    // Get site statistics
    const totalPages = await Page.countDocuments();
    const publishedPages = await Page.countDocuments({ status: 'published' });
    const draftPages = await Page.countDocuments({ status: 'draft' });
    const recentPages = await Page.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title slug status updatedAt author');

    // Render admin dashboard
    const dashboardHTML = generateDashboardHTML({
      stats: {
        totalPages,
        publishedPages,
        draftPages
      },
      recentPages,
      user: req.user
    });

    res.send(dashboardHTML);

  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).send('Error loading admin dashboard');
  }
});

// Admin pages management
router.get('/pages', authenticateToken, async (req, res) => {
  try {
    const pagesHTML = generatePagesHTML();
    res.send(pagesHTML);
  } catch (error) {
    console.error('Error loading pages admin:', error);
    res.status(500).send('Error loading pages admin');
  }
});

// Admin content management
router.get('/content', authenticateToken, async (req, res) => {
  try {
    const contentHTML = generateContentHTML();
    res.send(contentHTML);
  } catch (error) {
    console.error('Error loading content admin:', error);
    res.status(500).send('Error loading content admin');
  }
});

// Admin settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const settingsHTML = generateSettingsHTML();
    res.send(settingsHTML);
  } catch (error) {
    console.error('Error loading settings admin:', error);
    res.status(500).send('Error loading settings admin');
  }
});

function generateDashboardHTML(data) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Les Indép'en Bauges</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .admin-sidebar { background: linear-gradient(180deg, #1e293b 0%, #334155 100%); }
        .admin-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-card { transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); }
    </style>
</head>
<body class="bg-gray-50">
    <div class="flex h-screen">
        <!-- Sidebar -->
        <div class="admin-sidebar w-64 text-white flex flex-col">
            <div class="p-6 border-b border-gray-600">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span class="font-bold text-white">IB</span>
                    </div>
                    <div>
                        <h1 class="font-bold text-lg">Admin</h1>
                        <p class="text-gray-300 text-sm">Les Indép'en Bauges</p>
                    </div>
                </div>
            </div>
            
            <nav class="flex-1 p-4">
                <ul class="space-y-2">
                    <li>
                        <a href="/admin" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white">
                            <i class="fas fa-tachometer-alt w-5"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="/admin/pages" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors">
                            <i class="fas fa-file-alt w-5"></i>
                            <span>Pages</span>
                        </a>
                    </li>
                    <li>
                        <a href="/admin/content" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors">
                            <i class="fas fa-edit w-5"></i>
                            <span>Content</span>
                        </a>
                    </li>
                    <li>
                        <a href="/admin/settings" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors">
                            <i class="fas fa-cog w-5"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                </ul>
            </nav>
            
            <div class="p-4 border-t border-gray-600">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-gray-300"></i>
                    </div>
                    <div>
                        <p class="font-medium">Admin User</p>
                        <p class="text-gray-400 text-sm">Administrator</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <a href="/" class="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-center text-sm transition-colors">
                        <i class="fas fa-home mr-1"></i>
                        Site
                    </a>
                    <button onclick="logout()" class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-center text-sm transition-colors">
                        <i class="fas fa-sign-out-alt mr-1"></i>
                        Logout
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <header class="bg-white border-b border-gray-200 px-6 py-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p class="text-gray-600">Welcome to your admin dashboard</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-sm text-gray-500">Last login: ${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </header>
            
            <!-- Content -->
            <main class="flex-1 overflow-y-auto p-6">
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="admin-card stat-card p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Total Pages</p>
                                <p class="text-3xl font-bold text-gray-900">${data.stats.totalPages}</p>
                            </div>
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-file-alt text-blue-600 text-xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="admin-card stat-card p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Published</p>
                                <p class="text-3xl font-bold text-green-600">${data.stats.publishedPages}</p>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="admin-card stat-card p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Drafts</p>
                                <p class="text-3xl font-bold text-yellow-600">${data.stats.draftPages}</p>
                            </div>
                            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-edit text-yellow-600 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="admin-card p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div class="space-y-3">
                            <a href="/admin/pages" class="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                <i class="fas fa-plus text-blue-600"></i>
                                <span class="font-medium text-blue-900">Create New Page</span>
                            </a>
                            <button onclick="openPageManager()" class="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                <i class="fas fa-list text-green-600"></i>
                                <span class="font-medium text-green-900">Manage Pages</span>
                            </button>
                            <a href="/" target="_blank" class="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                <i class="fas fa-external-link-alt text-gray-600"></i>
                                <span class="font-medium text-gray-900">View Site</span>
                            </a>
                        </div>
                    </div>
                    
                    <div class="admin-card p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Pages</h3>
                        <div class="space-y-3">
                            ${data.recentPages.map(page => `
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p class="font-medium text-gray-900">${page.title}</p>
                                        <p class="text-sm text-gray-600">/${page.slug}</p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-1 text-xs rounded-full ${page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${page.status}</span>
                                        <a href="/${page.slug}" target="_blank" class="text-blue-600 hover:text-blue-800">
                                            <i class="fas fa-external-link-alt text-sm"></i>
                                        </a>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- System Info -->
                <div class="admin-card p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Database Status:</span>
                            <span class="text-green-600 font-medium">Connected</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Template Engine:</span>
                            <span class="text-blue-600 font-medium">Handlebars</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Home Page:</span>
                            <span class="text-green-600 font-medium">Database-driven</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Admin Panel:</span>
                            <span class="text-green-600 font-medium">Active</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
    
    <script>
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('admin_auth_token');
                window.location.href = '/';
            }
        }
        
        function openPageManager() {
            // Open the existing page manager in a new window/modal
            if (window.adminPageManager) {
                window.adminPageManager.showPageManager();
            } else {
                // Fallback: redirect to pages admin
                window.location.href = '/admin/pages';
            }
        }
        
        // Check authentication on page load
        function checkAuth() {
            const token = localStorage.getItem('admin_auth_token');
            if (!token) {
                window.location.href = '/admin/login';
                return false;
            }
            
            try {
                const authData = JSON.parse(token);
                if (!authData.data?.token && !authData.token) {
                    window.location.href = '/admin/login';
                    return false;
                }
            } catch (error) {
                window.location.href = '/admin/login';
                return false;
            }
            
            return true;
        }
        
        // Check auth on page load
        if (checkAuth()) {
            // Load admin page manager script
            const script = document.createElement('script');
            script.src = '/scripts/admin-pages.js';
            document.head.appendChild(script);
        }
    </script>
</body>
</html>
  `;
}

function generatePagesHTML() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Management - Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.2/dist/full.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .admin-sidebar { background: linear-gradient(180deg, #1e293b 0%, #334155 100%); }
    </style>
</head>
<body class="bg-gray-50">
    <div class="flex h-screen">
        ${generateSidebar('pages')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
            <header class="bg-white border-b border-gray-200 px-6 py-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Page Management</h1>
                        <p class="text-gray-600">Create and manage your website pages</p>
                    </div>
                </div>
            </header>
            
            <main class="flex-1 overflow-y-auto p-6">
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-semibold">All Pages</h2>
                        <button onclick="openPageManager()" class="btn btn-primary">
                            <i class="fas fa-plus mr-2"></i>Create New Page
                        </button>
                    </div>
                    
                    <div id="pages-container">
                        <p>Loading page management interface...</p>
                    </div>
                </div>
            </main>
        </div>
    </div>
    
    <script src="/scripts/admin-pages.js"></script>
    <script>
        function openPageManager() {
            if (window.adminPageManager) {
                window.adminPageManager.showPageManager();
            } else {
                setTimeout(openPageManager, 1000);
            }
        }
        
        // Initialize page manager when loaded
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                if (window.adminPageManager) {
                    openPageManager();
                }
            }, 1000);
        });
    </script>
</body>
</html>
  `;
}

function generateContentHTML() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Management - Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .admin-sidebar { background: linear-gradient(180deg, #1e293b 0%, #334155 100%); }
    </style>
</head>
<body class="bg-gray-50">
    <div class="flex h-screen">
        ${generateSidebar('content')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
            <header class="bg-white border-b border-gray-200 px-6 py-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Content Management</h1>
                        <p class="text-gray-600">Edit and manage your website content</p>
                    </div>
                </div>
            </header>
            
            <main class="flex-1 overflow-y-auto p-6">
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h2 class="text-xl font-semibold mb-6">Content Editor</h2>
                    <div class="space-y-6">
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 class="font-medium text-blue-900 mb-2">Rich Content Editor</h3>
                            <p class="text-blue-700">Advanced content editing features will be available here, including:</p>
                            <ul class="list-disc list-inside text-blue-700 mt-2 space-y-1">
                                <li>WYSIWYG editor for rich text content</li>
                                <li>Media insertion and management</li>
                                <li>Live preview capabilities</li>
                                <li>Version history and rollback</li>
                                <li>Content scheduling</li>
                            </ul>
                        </div>
                        
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 class="font-medium text-green-900 mb-2">Current Features</h3>
                            <p class="text-green-700">You can currently edit content through:</p>
                            <ul class="list-disc list-inside text-green-700 mt-2 space-y-1">
                                <li>Page management interface (Pages section)</li>
                                <li>Direct database page editing</li>
                                <li>Template-based content management</li>
                            </ul>
                        </div>
                        
                        <div class="flex gap-4">
                            <a href="/admin/pages" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
                                <i class="fas fa-file-alt mr-2"></i>Manage Pages
                            </a>
                            <a href="/" target="_blank" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors">
                                <i class="fas fa-external-link-alt mr-2"></i>View Site
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</body>
</html>
  `;
}

function generateSettingsHTML() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .admin-sidebar { background: linear-gradient(180deg, #1e293b 0%, #334155 100%); }
    </style>
</head>
<body class="bg-gray-50">
    <div class="flex h-screen">
        ${generateSidebar('settings')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
            <header class="bg-white border-b border-gray-200 px-6 py-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
                        <p class="text-gray-600">Configure your website settings</p>
                    </div>
                </div>
            </header>
            
            <main class="flex-1 overflow-y-auto p-6">
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h2 class="text-xl font-semibold mb-6">Site Configuration</h2>
                    <div class="space-y-6">
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 class="font-medium text-yellow-900 mb-2">Settings Panel</h3>
                            <p class="text-yellow-700">Advanced settings management will be available here, including:</p>
                            <ul class="list-disc list-inside text-yellow-700 mt-2 space-y-1">
                                <li>Site information and branding</li>
                                <li>SEO settings and meta tags</li>
                                <li>User management and permissions</li>
                                <li>System configuration</li>
                                <li>Backup and maintenance</li>
                            </ul>
                        </div>
                        
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 class="font-medium text-gray-900 mb-2">Current System Status</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Database:</span>
                                    <span class="text-green-600 font-medium">Connected</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Template Engine:</span>
                                    <span class="text-blue-600 font-medium">Handlebars</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Home Page:</span>
                                    <span class="text-green-600 font-medium">Database-driven</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Admin Interface:</span>
                                    <span class="text-green-600 font-medium">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</body>
</html>
  `;
}

function generateSidebar(activeSection) {
  const sections = [
    { id: 'dashboard', name: 'Dashboard', icon: 'fas fa-tachometer-alt', url: '/admin' },
    { id: 'pages', name: 'Pages', icon: 'fas fa-file-alt', url: '/admin/pages' },
    { id: 'content', name: 'Content', icon: 'fas fa-edit', url: '/admin/content' },
    { id: 'settings', name: 'Settings', icon: 'fas fa-cog', url: '/admin/settings' }
  ];

  return `
    <div class="admin-sidebar w-64 text-white flex flex-col">
        <div class="p-6 border-b border-gray-600">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span class="font-bold text-white">IB</span>
                </div>
                <div>
                    <h1 class="font-bold text-lg">Admin</h1>
                    <p class="text-gray-300 text-sm">Les Indép'en Bauges</p>
                </div>
            </div>
        </div>
        
        <nav class="flex-1 p-4">
            <ul class="space-y-2">
                ${sections.map(section => `
                    <li>
                        <a href="${section.url}" class="flex items-center gap-3 px-4 py-3 rounded-lg ${section.id === activeSection ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600 hover:text-white'} transition-colors">
                            <i class="${section.icon} w-5"></i>
                            <span>${section.name}</span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </nav>
        
        <div class="p-4 border-t border-gray-600">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-gray-300"></i>
                </div>
                <div>
                    <p class="font-medium">Admin User</p>
                    <p class="text-gray-400 text-sm">Administrator</p>
                </div>
            </div>
            <div class="flex gap-2">
                <a href="/" class="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-center text-sm transition-colors">
                    <i class="fas fa-home mr-1"></i>
                    Site
                </a>
                <button onclick="logout()" class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-center text-sm transition-colors">
                    <i class="fas fa-sign-out-alt mr-1"></i>
                    Logout
                </button>
            </div>
        </div>
    </div>
    
    <script>
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('admin_auth_token');
                window.location.href = '/';
            }
        }
    </script>
  `;
}

module.exports = router;