# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tuition Media** is a Bangladesh tuition marketplace connecting guardians (parents) with tutors. It is built with Laravel 13 + Inertia.js + React 19 + TypeScript + Tailwind CSS v4.

## Commands

### Development
```bash
composer run dev        # Starts PHP server + queue listener + Vite concurrently
```

### PHP / Backend
```bash
php artisan test                     # Run all tests
php artisan test --filter TestName   # Run a specific test
composer run lint                    # Auto-fix PHP style (Laravel Pint)
composer run lint:check              # Check PHP style without fixing
php artisan migrate                  # Run pending migrations
php artisan db:seed                  # Seed all seeders
php artisan db:seed --class=LargeTestDataSeeder  # Seed large dataset for testing
```

### JS / Frontend
```bash
npm run dev            # Vite dev server only
npm run build          # Production build
npm run lint:check     # ESLint check
npm run lint           # ESLint auto-fix
npm run format:check   # Prettier check
npm run format         # Prettier auto-fix
npm run types:check    # TypeScript type check (no emit)
```

### Full CI check
```bash
composer run ci:check  # lint:check + format:check + types:check + php tests
```

## Architecture

### Stack
- **Backend**: Laravel 13, Laravel Fortify (auth), Inertia.js (SSR bridge)
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Radix UI primitives, Sonner toasts, react-select
- **Testing**: Pest PHP
- **Routing**: Laravel Wayfinder generates type-safe route helpers into `resources/js/wayfinder/`

### Authentication
Login uses **Bangladesh phone numbers** (not email). `App\Support\BangladeshPhoneNumber` normalizes variants (`01XXXXXXXXX`, `8801XXXXXXXXX`, `+8801XXXXXXXXX`) to canonical `+88XXXXXXXXX` form. Fortify's `authenticateUsing` callback performs this lookup.

### User Roles
Three roles defined as constants on `App\Models\User`:
- `admin` — platform operator
- `guardian` — parent/student posting tuition jobs
- `tutor` — educator applying for jobs

Password minimum length differs by role: guardian/tutor require only 4 characters; admin uses `Password::default()`.

### Inertia Page Layout System
Layout is assigned in `resources/js/app.tsx` based on the page component name:
- `welcome`, `FindTutors`, `tuition-jobs/*`, `tuition-posts/*` → no layout (public pages)
- `auth/*` → `AuthLayout`
- `settings/*` → `[AppLayout, SettingsLayout]`
- everything else → `AppLayout` (authenticated sidebar layout)

### Route Structure
All routes are in `routes/web.php`. Protected routes use `auth` + `verified` middleware. Admin routes additionally use `EnsureUserIsAdmin` middleware. Custom route model bindings ensure `{tutor}` and `{guardian}` parameters resolve only users with the matching role.

Key route groups:
- `admin/*` — admin-only management (tuition posts, applications, commissions, tutors, guardians, tutor requests)
- `guardian/*` — guardian CRUD for tuition posts and applications
- `tutor/*` — tutor profile edit, application management
- Public: `/find-tutors`, `/tuition-jobs`, `/tuition-posts/{id}`, `/api/locations`, `/api/subjects`

### Domain Models
| Model | Key relationships |
|---|---|
| `User` | has one `TutorProfile`; has many `TuitionPost` (as guardian); has many `TuitionApplication` (as tutor) |
| `TuitionPost` | belongs to guardian `User`; has many `TuitionApplication`, `TuitionPostStudent`; belongs to many `University` (preferred) |
| `TuitionApplication` | belongs to `TuitionPost` and tutor `User`; tracks `status`, `commission_payment_status`, `commission_amount` |
| `TutorProfile` | belongs to `User`; belongs to many `Subject` (via `tutor_subjects`); belongs to many `Subdistrict` (preferred locations) |
| `TutorRequest` | guardian directly requests a specific tutor; grouped by `request_group_id` when multiple class levels are submitted together |
| `Notification` | in-app notification model for users |
| `CommissionPayment` | commission payment records tied to hired `TuitionApplication` |

### TuitionPost Auto-Codes
`TuitionPost` self-assigns a `tuition_code` on creation (e.g. `TID00000001`) via a `booted()` hook.

### Tutor Request → Tuition Post Flow
When admin assigns a `TutorRequest`, the `assign` action in `Admin\TutorRequestController` creates a `TuitionPost`, corresponding `TuitionPostStudent` rows, and an auto-accepted `TuitionApplication` in one DB transaction.

### Localization
Two locales: `en` and `bn` (Bangla). Translation files at `lang/en/en.php` and `lang/bn/bn.php`. Locale is toggled via `POST /lang` and stored in the session.

### Seeders
- `DatabaseSeeder` — seeds admin user + location/subject/university data
- `AdminUserSeeder` — reads admin credentials from `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_PHONE`)
- `LargeTestDataSeeder` — generates bulk guardian/tutor/post data for performance testing

### Frontend Conventions
- Page components live in `resources/js/pages/` mirroring the Inertia render name
- Shared UI components are in `resources/js/components/ui/` (Radix-based, shadcn-style)
- Toast notifications use Sonner via `resources/js/components/ui/sonner.tsx`; flash `toast` in the session from the backend triggers them
- Type definitions for shared Inertia props are in `resources/js/types/` (auth, navigation, ui)
- Wayfinder route helpers are auto-generated; never hand-write route URLs in TypeScript — import from `@/wayfinder`
