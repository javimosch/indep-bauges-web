# Admin Mode Documentation

This document provides a comprehensive guide to the admin mode functionality of the Les Indép'en Bauges website. Admin mode allows authorized users to make content changes directly on the website without needing to edit code files.

## Table of Contents

1. [Accessing Admin Mode](#accessing-admin-mode)
2. [Admin Interface](#admin-interface)
3. [Editing Content](#editing-content)
4. [Keyboard Shortcuts](#keyboard-shortcuts)
5. [MongoDB Integration](#mongodb-integration)
6. [Audit History](#audit-history)
7. [Script & Style Injections](#script--style-injections)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

## Accessing Admin Mode

To access admin mode:

1. Navigate to any page on the website
2. Press `Ctrl+Shift+A` to reveal the admin login prompt
3. Enter the admin password (set via the `ADMIN_PASSWORD` environment variable)
4. Upon successful authentication, the admin bar will appear at the top of the page

The authentication system is implemented in `src/scripts/admin.js` and uses JWT (JSON Web Tokens) for secure authentication. The server-side authentication endpoint is defined in `src/server.js` under the `/api/auth` route.

**Note**: Authentication tokens are stored in the browser's localStorage and expire after 24 hours. The token management is handled by the `Storage` utility in `src/scripts/admin-helpers.js`.

## Admin Interface

The admin interface consists of a top bar with several controls that appears at the top of the page when in admin mode. The admin bar is created dynamically by the `createAdminBar()` function in `src/scripts/admin.js`.

### Left Side Controls

- **ADMIN MODE**: Indicator showing you're in admin mode
- **Enable/Disable Edit Mode**: Toggle button to enable or disable content editing
  - Keyboard shortcut: `Ctrl+Shift+E`
- **Last Edit**: Timestamp of the most recent edit
- **Your Name**: Input field to enter your name (required before editing)

### Right Side Controls

- **MongoDB Status**: Indicator showing MongoDB connection status
- **Sync from MongoDB**: Button to sync content from MongoDB to local files
- **Audit History**: Button to view the history of content changes
- **Open in New Tab**: Opens the current page in a new tab
- **Logout**: Logs out of admin mode

## Editing Content

To edit content on the website:

1. Enter your name in the "Your name" field and click "Save"
2. Click "Enable Edit Mode" or press `Ctrl+Shift+E`
3. Editable elements will be highlighted with a dashed outline
4. Click on any highlighted element to open the editor
5. Make your changes in the editor
6. Click "Save Changes" or press `Ctrl+Enter` to save

The editing functionality is implemented in `src/scripts/admin.js` with several key functions:

- `toggleEditMode()`: Enables/disables edit mode
- `enableEditableElements()`: Adds event listeners and styling to editable elements
- `handleEditableClick()`: Handles clicks on editable elements
- `openEditor()`: Creates and displays the editor interface
- `saveChanges()`: Saves the edited content via API

The server-side content update is handled by the `/api/content` endpoint in `src/server.js`, which calls the `updateElementInSections()` function to modify the content in the section files.

### Editing Different Element Types

The editor adapts based on the type of element you're editing:

#### Text Elements (headings, paragraphs, spans)

For basic text elements, you'll see a simple content editor with a textarea for modifying the content. The editor is created by the `openEditor()` function in `src/scripts/admin.js` and adapts based on the element type being edited.

#### Links

For links, you'll see additional fields:

- **Link URL (href)**: The destination URL
- **Link Target**: How the link opens (same window, new window, etc.)
- **Link Text**: The visible text of the link

The link editor includes a dropdown for the target attribute with options for same window, new window, parent frame, or full window. This specialized link editing functionality is implemented in the `openEditor()` and `saveChanges()` functions in `src/scripts/admin.js`.

### Related Elements

When editing nested elements (like a span inside a link), the editor shows related elements:

- **Parent Elements**: Elements that contain the current element (shown in blue)
- **Child Elements**: Elements contained within the current element (shown in green)
- **Sibling Elements**: Elements at the same level as the current element (shown in purple)

This feature is implemented using the `findRelatedElements()` function in `src/scripts/admin.js`, which traverses the DOM to identify related elements with data-id attributes. Each related element is displayed as a button that, when clicked, switches the editor to that element.

Click on any related element to switch to editing that element instead.

## Keyboard Shortcuts

The admin interface supports several keyboard shortcuts for efficiency:

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+A` | Show admin login prompt | Anywhere on the site |
| `Ctrl+Shift+E` | Toggle edit mode | When authenticated |
| `Ctrl+Enter` | Save changes | When editing an element |
| `Esc` | Cancel editing | When editing an element |

These keyboard shortcuts are implemented in `src/scripts/admin.js` using event listeners. The `Ctrl+Shift+E` shortcut is handled by a global keydown event listener, while the `Ctrl+Enter` and `Esc` shortcuts are specific to the editor component. Visual hints for these shortcuts are displayed in the UI to help users discover them.

## MongoDB Integration

Content changes are automatically saved to MongoDB when connected. This provides:

1. Persistence across server restarts
2. Synchronization between environments
3. Backup of content changes

The MongoDB integration is implemented in `src/db/sync.js`, which provides functions for saving content to MongoDB and syncing between MongoDB and the filesystem. The MongoDB models are defined in `src/models/Section.js` and `src/models/Audit.js`.

### Syncing from MongoDB

To pull content from MongoDB to the local filesystem:

1. Click the "Sync from MongoDB" button
2. Confirm the action in the warning dialog
3. Wait for the sync to complete
4. The page will automatically reload with the updated content

This functionality is implemented in the `syncFromMongo()` function in `src/scripts/admin.js`, which calls the server-side sync endpoint defined in `src/server.js`. The server uses the `syncFromMongo()` function from `src/db/sync.js` to perform the actual synchronization.

**Warning**: This will overwrite local files with content from MongoDB. Use with caution. A confirmation dialog with a clear warning message is shown before proceeding with this action.

## Audit History

The admin interface includes a comprehensive audit history system implemented in `src/scripts/admin.js` with the `showAuditHistory()`, `loadAuditLogs()`, and `updateAuditTable()` functions. The audit data is stored in MongoDB using the schema defined in `src/models/Audit.js`.

To access the audit history:

1. Click the "Audit History" button in the admin bar
2. View the list of changes with details:
   - Timestamp
   - Admin name
   - File modified
   - Element type and ID
   - Content changes
   - Attribute changes (for links)

The audit history modal is created by the `createAuditModal()` function in `src/scripts/admin.js`. The audit logs are fetched from the server using the `/api/audit` endpoint defined in `src/server.js`, which queries the MongoDB Audit collection.

### Filtering Audit Logs

You can filter the audit logs by:

- Admin name
- Element type
- File
- Date range

Click "Apply Filters" to update the view based on your selections. The filtering functionality is implemented in the `applyAuditFilters()` and `resetAuditFilters()` functions in `src/scripts/admin.js`. The server-side filtering is handled by the audit endpoint in `src/server.js`, which applies the filters to the MongoDB query.

## Script & Style Injections

The admin interface includes a script and style injection system that allows administrators to add custom JavaScript or CSS to the website without modifying code files. This is useful for adding analytics scripts, custom styles, or other third-party integrations.

### Accessing the Injections Manager

1. Click the "Script & Style Injections" button in the admin bar
2. View the list of existing injections or create new ones

### Creating a New Injection

1. Click "Add New Injection" in the injections manager
2. Fill out the form:
   - **Name**: A descriptive name for the injection (e.g., "Google Analytics")
   - **Type**: Select between "script" (JavaScript) or "style" (CSS)
   - **Injection Location**: Choose where to inject the code:
     - **Before Body Close**: End of the HTML body (recommended for most scripts)
     - **Before Head Close**: End of the HTML head (for styles or scripts that need to load early)
   - **Code**: The actual JavaScript or CSS code to inject
3. Click "Save Injection"

### Managing Injections

For each injection, you can:

- **Edit**: Modify the injection's name, type, location, or code
- **Activate/Deactivate**: Toggle whether the injection is active without deleting it
- **Delete**: Permanently remove the injection

### System vs. User Injections

- **System Injections**: Created by the system or plugins and cannot be edited or deleted by users (marked as "system" origin)
- **User Injections**: Created by admin users and can be fully managed

### Implementation Details

Injections are implemented using the following components:

- MongoDB model defined in `src/models/Injection.js`
- DB utilities in `src/db/injection.js`
- API endpoints in `src/server.js` under `/api/injections`
- Frontend management interface in `src/scripts/admin-injections.js`

All injections have unique IDs and include attributes to prevent duplicate injections when the page is loaded.

## Security Considerations

The admin mode includes several security features:

1. **Password Protection**: Access requires a valid password set via the `ADMIN_PASSWORD` environment variable in `src/server.js`
2. **JWT Authentication**: Secure token-based authentication implemented in the `/api/auth` endpoint in `src/server.js`
3. **Token Expiry**: Authentication tokens expire after 24 hours, configured in `CONFIG.authTokenExpiry` in `src/scripts/admin.js`
4. **Audit Logging**: All changes are logged with user information, IP address, and user agent in `src/models/Audit.js`
5. **Name Requirement**: Edits require providing a name for accountability, enforced by the `toggleEditMode()` function in `src/scripts/admin.js`

The authentication middleware (`authenticateToken`) in `src/server.js` verifies the JWT token for all protected API endpoints. The token is stored securely in the browser's localStorage and is included in the Authorization header for all API requests.

## Troubleshooting

### Common Issues

1. **Can't access admin mode**
   - Ensure the correct password is being used
   - Check that the `ADMIN_PASSWORD` environment variable is set correctly in `.env` file
   - Verify the JWT secret is properly set in the server configuration
   - Check browser console for authentication errors

2. **Can't enable edit mode**
   - Ensure you've entered your name in the admin bar (required field)
   - Try refreshing the page and logging in again
   - Check if the `toggleEditMode()` function in `src/scripts/admin.js` is being called

3. **Changes not saving**
   - Check MongoDB connection status in the admin bar
   - Ensure you have proper permissions to write to the filesystem
   - Check the server logs for errors in the `updateElementInSections()` function in `src/server.js`
   - Verify that the element has a valid `data-id` attribute

4. **Keyboard shortcuts not working**
   - Ensure you're in the correct context (admin mode for Ctrl+Shift+E, editor for Ctrl+Enter)
   - Check if there are any browser extensions that might be capturing the keyboard shortcuts

5. **Script & Style injections not working**
   - Check that the injection is marked as "Active"
   - Verify that you've selected the correct injection location
   - Ensure that the code doesn't contain syntax errors
   - Check that a similar injection with the same ID doesn't already exist
   - Verify that the event listeners in `src/scripts/admin.js` are properly registered

### Getting Help

If you encounter issues not covered in this documentation, please:

1. Check the browser console for JavaScript errors
2. Review the server logs for backend errors
3. Examine the relevant code files mentioned in this documentation
4. Contact the site administrator or refer to the technical documentation in the project repository

---

*Last updated: April 2025*
