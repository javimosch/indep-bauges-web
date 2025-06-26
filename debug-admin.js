// Debug script to help with admin button issues
// Run this in browser console after logging in as admin

console.log('=== Admin Debug Info ===');

// Check admin token
const token = localStorage.getItem('admin_auth_token');
console.log('Admin token:', token ? 'Found' : 'Not found');

// Check if adminPageManager exists
console.log('adminPageManager:', typeof window.adminPageManager);

// Check for admin elements
const adminElements = document.querySelectorAll('[class*="admin"]');
console.log('Elements with "admin" in class:', adminElements.length);
adminElements.forEach((el, i) => {
  console.log(`  ${i}: ${el.tagName}.${el.className}`);
});

// Check for existing Pages button
const pagesBtn = document.getElementById('admin-pages-btn');
console.log('Pages button exists:', !!pagesBtn);

// Try to manually add the button
if (window.adminPageManager && !pagesBtn) {
  console.log('Attempting to manually add Pages button...');
  window.adminPageManager.addPageManagementButton();
  
  // Check again after adding
  setTimeout(() => {
    const newBtn = document.getElementById('admin-pages-btn');
    console.log('Pages button after manual add:', !!newBtn);
  }, 500);
}

// Show how to manually open page manager
console.log('\nTo manually open page manager, run:');
console.log('adminPageManager.showPageManager()');

console.log('=== End Debug Info ===');