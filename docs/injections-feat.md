# Global Script/Style Injection Feature

## Overview

This feature enables admin users to manage global script and style injections for the website. Admins can add, edit, activate/deactivate, or remove custom JavaScript or CSS that will be injected into the site at specific locations (before the closing `</head>` or `</body>` tags). Injections are persisted in MongoDB and are not injected twice (each injection has a unique ID). System-originated injections are read-only.

---

## Key Features

- **Admin UI integration**: New "Script & Style Injections" button in the admin bar opens a modal manager for all injections.
- **Injection types**: Supports both `script` (JavaScript) and `style` (CSS).
- **Injection locations**: Choose between `before-head-close` and `before-body-close`.
- **Origin**: Injections can be created by `user` (admin) or `system` (read-only, e.g., plugins).
- **Persistence**: All injections are stored in MongoDB via the `Injection` model.
- **No duplicates**: Each injection is injected only once per page, using a unique ID as the element's `id` attribute.
- **Searchable**: Injections can be filtered by type, location, origin, and status.
- **Activation**: Injections can be toggled active/inactive without deleting them.
- **System injections**: Cannot be edited or deleted by users.
- **Full auditability**: All API endpoints log debug information.

---

## Implementation Summary

### Backend
- **Model**: `src/models/Injection.js` defines the schema for injections.
- **DB Utilities**: `src/db/injection.js` provides CRUD and query helpers.
- **API Endpoints**: `/api/injections` (CRUD) in `src/server.js`.
- **HTML Injection**: Middleware in `src/server.js` injects active scripts/styles at the correct location on every HTML response.

### Frontend
- **Admin UI**: `src/scripts/admin-injections.js` provides a modal UI for managing injections.
- **Admin Bar**: The button is added in `src/scripts/admin.js` (`createAdminBar`).
- **Usage**: Admins can add, edit, activate/deactivate, or delete injections from the modal UI. System injections are visible but not editable/deletable.

### Documentation
- **Admin Guide**: Usage and troubleshooting are documented in `docs/admin-mode.md`.
- **Feature Doc**: This file (`docs/injections-feat.md`).

---

## Example Use Cases

- **Analytics**: Inject a Google Analytics script site-wide without touching code.
- **Custom Styles**: Override Tailwind or add CSS tweaks globally.
- **Third-party Integrations**: Add chat widgets, A/B testing, etc.

---

## API Example

- **List injections**: `GET /api/injections`
- **Create injection**: `POST /api/injections` (fields: name, type, code, location, origin)
- **Update injection**: `PUT /api/injections/:id`
- **Delete injection**: `DELETE /api/injections/:id`

---

## Security & Rules

- Only authenticated admins can manage injections.
- System injections are enforced as read-only via backend checks.
- All actions are logged with debug info as per project rules.
- New env variables (if any) must be added to `.env.example` (N/A for this feature).
- The code is modularized and follows the 200-lines-per-file guideline.

---

## File List

- `src/models/Injection.js`
- `src/db/injection.js`
- `src/scripts/admin-injections.js`
- `src/scripts/admin.js` (button integration)
- `src/server.js` (API, middleware)
- `docs/admin-mode.md` (user-facing docs)
- `docs/injections-feat.md` (this file)

---

## Last Updated

April 28, 2025
