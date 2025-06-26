/**
 * Admin Authentication Routes
 */

const express = require('express');
const router = express.Router();

// Admin login page
router.get('/login', (req, res) => {
  const loginHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Les Indép'en Bauges</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .login-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    </style>
</head>
<body class="login-bg min-h-screen flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span class="text-white font-bold text-2xl">IB</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p class="text-gray-600">Les Indép'en Bauges</p>
        </div>
        
        <form id="loginForm" class="space-y-6">
            <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password
                </label>
                <div class="relative">
                    <input type="password" id="password" name="password" required
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-12">
                    <i class="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
            </div>
            
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                <i class="fas fa-sign-in-alt mr-2"></i>
                Login to Admin
            </button>
        </form>
        
        <div id="error-message" class="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg hidden">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span id="error-text">Invalid password</span>
        </div>
        
        <div class="mt-6 text-center">
            <a href="/" class="text-blue-600 hover:text-blue-800 text-sm">
                <i class="fas fa-arrow-left mr-1"></i>
                Back to Site
            </a>
        </div>
    </div>
    
    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-message');
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Store token
                    localStorage.setItem('admin_auth_token', JSON.stringify(data));
                    
                    // Redirect to admin dashboard
                    window.location.href = '/admin';
                } else {
                    // Show error
                    errorDiv.classList.remove('hidden');
                    document.getElementById('error-text').textContent = data.message || 'Invalid password';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorDiv.classList.remove('hidden');
                document.getElementById('error-text').textContent = 'Login failed. Please try again.';
            }
        });
        
        // Check if already logged in
        const token = localStorage.getItem('admin_auth_token');
        if (token) {
            try {
                const authData = JSON.parse(token);
                if (authData.data?.token || authData.token) {
                    // Already logged in, redirect to admin
                    window.location.href = '/admin';
                }
            } catch (error) {
                // Invalid token, continue with login
            }
        }
    </script>
</body>
</html>
  `;
  
  res.send(loginHTML);
});

module.exports = router;