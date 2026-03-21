# CallSure UI — Test Suite Documentation

## Overview

This test suite provides comprehensive coverage across **3 layers** for the CallSure UI (`callsure-ui`) Next.js application. All tests are **fully mocked** — no real Supabase calls, no SendGrid emails, no data is ever modified.

---

## Directory Structure

```
__tests__/
├── README.md                              ← This file
├── setup.ts                               ← Global test setup & mocks
│
├── unit/
│   ├── lib/
│   │   ├── utils.test.ts                  ← cn() Tailwind utility (10 tests)
│   │   └── emailService.test.ts           ← SendGrid email service (12 tests)
│   ├── store/
│   │   └── auth-store.test.ts             ← Auth Zustand store (40+ tests)
│   └── components/
│       ├── LoginForm.test.tsx             ← Login form component (23 tests)
│       ├── AddUserModal.test.tsx          ← Add user modal (16 tests)
│       ├── UserManagement.test.tsx        ← User management table (13 tests)
│       └── ResetPassword.test.tsx         ← Reset password page (15 tests)
│
├── api/
│   ├── auth-validate.test.ts              ← POST /api/auth/validate (13 tests)
│   ├── auth-forgot-password.test.ts       ← POST /api/auth/forgot-password (11 tests)
│   ├── users-create.test.ts               ← POST /api/users/create (17 tests)
│   ├── users-pending.test.ts              ← GET /api/users/pending (13 tests)
│   ├── users-promote-admin.test.ts        ← POST /api/users/promote-admin (12 tests)
│   ├── users-update-metadata.test.ts      ← POST /api/users/update-metadata (10 tests)
│   ├── action-items.test.ts               ← POST/GET /api/action-items (20 tests)
│   └── action-items-bulk.test.ts          ← GET /api/action-items/bulk (12 tests)
│
└── e2e/
    ├── login.spec.ts                      ← Login flow (14 scenarios)
    ├── forgot-password.spec.ts            ← Forgot password flow (7 scenarios)
    ├── dashboard-navigation.spec.ts       ← Navigation & protected pages (8 scenarios)
    └── user-management.spec.ts            ← User management UI (12 scenarios)
```

**Total: ~220+ test cases**

---

## Quick Start

### Prerequisites

- Node.js 18+ (already in project)
- Dependencies installed: `npm install` (test packages are already in devDependencies)

### Run All Unit + API Tests

```bash
npm run test
```

### Run Tests in Watch Mode (re-runs on file change)

```bash
npm run test:watch
```

### Run with Coverage Report

```bash
npm run test:coverage
# Opens HTML report at coverage/index.html
```

### Run E2E Tests (requires running dev server)

```bash
# Terminal 1 — start the app
npm run dev

# Terminal 2 — run E2E tests
npm run test:e2e
```

### Run E2E Tests with Playwright UI (interactive)

```bash
npm run test:e2e:ui
```

### Run E2E Tests in Headed Mode (see the browser)

```bash
npm run test:e2e:headed
```

### Install Playwright Browsers (first time only)

```bash
npx playwright install chromium
```

---

## Test Frameworks & Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit + API test runner (Jest-compatible) |
| **@testing-library/react** | Render and query React components |
| **@testing-library/user-event** | Simulate real user interactions (typing, clicking) |
| **@testing-library/jest-dom** | DOM assertion matchers (`toBeInTheDocument`, etc.) |
| **jsdom** | Simulated browser environment for unit tests |
| **Playwright** | Real browser E2E testing |

---

## Mock Strategy

**All external dependencies are mocked.** Nothing hits a real server.

### What's Mocked

| Dependency | Mock | Location |
|-----------|------|---------|
| `fetch` (Supabase API calls) | `vi.fn()` per test | Each test file |
| `@sendgrid/mail` | `vi.mock()` | `emailService.test.ts` |
| `@supabase/supabase-js` | `vi.mock()` | `ResetPassword.test.tsx` |
| `next/navigation` (router) | `vi.mock()` | `setup.ts` |
| `next/image` | `vi.mock()` | `setup.ts` |
| `sonner` (toast) | `vi.mock()` | `setup.ts` |
| `localStorage` | In-memory mock | `setup.ts` |
| Environment variables | `vi.stubEnv()` | `setup.ts` + per-test |
| Zustand auth store | `vi.mock()` per component | Component test files |

### E2E Mock Strategy

Playwright tests use `page.route()` to intercept real network requests and return mock responses. The app runs against the real dev server, but API calls return controlled mock data:

```typescript
await page.route("**/auth/v1/token**", async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ user: { role: "admin", ... } })
  });
});
```

This means:
- No real Supabase calls
- No real SendGrid emails
- No data created, modified, or deleted

---

## Unit Tests — Detailed

### `unit/lib/utils.test.ts`

Tests the `cn()` Tailwind class merging utility from [lib/utils.ts](../lib/utils.ts).

| Test | What it verifies |
|------|-----------------|
| Merges multiple class strings | `cn("foo", "bar")` → `"foo bar"` |
| Handles empty inputs | `cn()`, `cn("")`, `cn(undefined)`, `cn(null)` all return `""` |
| Handles conditional classes | `cn("base", false && "hidden", true && "visible")` → `"base visible"` |
| Deduplicates conflicting Tailwind classes | `cn("px-2", "px-4")` → `"px-4"` (last wins) |
| Merges responsive variants | `cn("md:px-2", "md:px-4")` → `"md:px-4"` |
| Handles array inputs | `cn(["foo", "bar"])` → `"foo bar"` |
| Handles object inputs (clsx style) | `cn({ foo: true, bar: false })` → `"foo"` |
| Handles mixed inputs | strings + arrays + objects combined |
| Preserves non-conflicting classes | `cn("p-4", "m-2")` → `"p-4 m-2"` |
| Handles null/undefined in arrays | Filters them out gracefully |

---

### `unit/lib/emailService.test.ts`

Tests `sendWelcomeEmail()` from [lib/emailService.ts](../lib/emailService.ts). SendGrid is fully mocked.

| Test | What it verifies |
|------|-----------------|
| Returns false when API key missing | No key → no attempt, returns `false` |
| Sets SendGrid API key | Calls `sgMail.setApiKey()` with correct key |
| Sends email with correct params | `to`, `from`, `subject` are correct |
| Returns true on success | `true` when SendGrid responds |
| Returns false on failure | `false` when SendGrid throws |
| Logs SendGrid error details | `response.body` is logged |
| HTML contains user name | `Hello Test User!` in body |
| HTML contains email address | User email appears in content |
| HTML contains role | Role value in content |
| HTML contains extension | Extension number in content |
| HTML contains temporary password | Password appears in password box |
| Generates valid HTML document | Has `<!DOCTYPE html>` and `</html>` |

---

### `unit/store/auth-store.test.ts`

Tests the Zustand auth store from [store/auth/store.ts](../store/auth/store.ts). All `fetch` calls are mocked.

#### Initial State (4 tests)
- Starts with `user: null`
- Starts with `isAuthenticated: false`
- Starts with `isLoading: false`
- Starts with `error: null`

#### `login()` (16 tests)
- Sets `isLoading: true` during request
- Clears previous errors before attempting
- Returns `"success:admin"` for admin role
- Returns `"success:agent"` for agent role
- Returns `"success:super-admin"` for super-admin
- Defaults to `"success:agent"` when no role in metadata
- Sets `user` and `isAuthenticated: true` on success
- Clears `isLoading` on success
- Returns `"pending"` when `app_metadata.status === "pending"`
- Returns `"pending"` when `user_metadata.status === "pending"`
- Does NOT set user/isAuthenticated when pending
- Returns `"error"` for invalid credentials
- Sets `error` message on invalid credentials
- Handles `email_not_confirmed` error code
- Handles `email_not_confirmed` via `msg` field
- Handles PENDING_APPROVAL from 400 response
- Clears `isLoading` on error
- Handles network errors
- Calls Supabase token endpoint with correct body

#### `signup()` (9 tests)
- Blocks `yopmail.com` domain
- Blocks `guerrillamail.com` domain
- Blocks `10minutemail.com` domain
- Sets `isLoading: true` during request
- Calls Supabase `/auth/v1/signup` for valid email
- Calls `/api/users/update-metadata` after signup
- Handles Supabase signup failure (sets error)
- Handles missing userId in signup response
- Clears `isLoading` on failure
- Allows legitimate email domains (gmail.com, etc.)

#### `logout()` (3 tests)
- Clears `user`
- Sets `isAuthenticated: false`
- Clears `error`

#### `clearError()` (1 test)
- Sets `error` to `null`

#### `validateSession()` (5 tests)
- Returns `{ valid: false, user: null }` when no user
- Returns valid user data on successful validation
- Logs out user on API failure (401)
- Logs out user on network error
- Calls `/api/auth/validate` with correct `userId`

#### `checkUserStatus()` (5 tests)
- Returns `"error"` when no user in store
- Returns `"pending"` for pending users
- Returns `"approved"` for active users
- Returns `"error"` on API failure
- Returns `"error"` on network failure

#### `checkUserRole()` (5 tests)
- Returns `"error"` when no user
- Returns user role from API
- Returns `"agent"` as default role
- Returns `"error"` on API failure
- Returns `"error"` when user not found in response

---

### `unit/components/LoginForm.test.tsx`

Tests [components/auth/LoginForm.tsx](../components/auth/LoginForm.tsx). Auth store and router are mocked.

#### Rendering (7 tests)
- Email input visible
- Password input visible
- Login button visible
- Login heading visible
- Forgot password link visible
- Email input type is `"email"`
- Password input type is `"password"`

#### Validation (5 tests)
- Error for empty email on blur
- Error for invalid email format on blur
- Error for empty password on blur
- Error clears when user types
- No errors shown before blur (untouched fields)

#### Form Submission (6 tests)
- Calls `login()` with email and password
- Redirects to `/dashboard` on `"success:admin"`
- Redirects to `/dashboard` on `"success:super-admin"`
- Redirects to `/agent` on `"success:agent"`
- Redirects to `/pending-approval?from=login` on `"pending"`
- No redirect on `"error"`

#### Loading State (2 tests)
- Shows `"Logging in..."` text when `isLoading: true`
- Button is disabled when loading

#### Auth Error Display (2 tests)
- Displays `authError` from store in red box
- No error div when error is null

#### Forgot Password Dialog (7 tests)
- Opens dialog on Forgot Password click
- Pre-fills email from login form
- Shows error for invalid forgot email
- Calls `/api/auth/forgot-password` API on submit
- Shows error on API failure
- Renders Cancel button
- Renders Send Reset Link button

---

### `unit/components/AddUserModal.test.tsx`

Tests [components/admin/AddUserModal.tsx](../components/admin/AddUserModal.tsx).

#### Rendering (8 tests)
- Modal visible when `isOpen: true`
- Modal hidden when `isOpen: false`
- Full Name input
- Extension input
- Email input
- Role select
- Create User button
- Cancel button

#### Validation (7 tests)
- Error for empty name on blur
- Error for name < 2 characters
- Error for empty extension on blur
- Error for non-numeric extension (`"abc"`)
- Error for empty email on blur
- Error for invalid email format
- Error clears when user types

#### Form Submission (7 tests)
- Does not call API when form invalid
- Calls `/api/users/create` with Authorization header
- Sends correct body (name, email, extension, role)
- Calls `onUserCreated` callback on success
- Calls `onClose` on success
- Does not close on API error
- Does not close on network error

#### Cancel / Close (1 test)
- Calls `onClose` when Cancel clicked

---

### `unit/components/UserManagement.test.tsx`

Tests [components/admin/UserManagement.tsx](../components/admin/UserManagement.tsx).

| Test | What it verifies |
|------|-----------------|
| Shows loading spinner initially | Spinner while fetching |
| Fetches and displays users | All 3 mock users appear |
| Displays user emails | Emails in table |
| Displays user roles | Roles rendered as badges |
| Displays user count badge | Count matches total |
| Displays User Management heading | Present after load |
| Renders Add User button | Visible after load |
| Shows 'You' for current user | Current user row has "You" label |
| Shows extensions from user_metadata | Extension numbers visible |
| Shows empty state when no users | "No users" message |
| Handles fetch error gracefully | Component doesn't crash |
| Handles network error gracefully | Component doesn't crash |
| Fetches with correct auth header | `Authorization: Bearer current-admin` |
| Opens AddUserModal on Add User click | Modal appears |

---

### `unit/components/ResetPassword.test.tsx`

Tests [app/reset-password/page.tsx](../app/reset-password/page.tsx). Supabase client is mocked.

#### Without Tokens (4 tests)
- Shows "invalid or has expired" message
- Shows Back to Login button
- Does not show password form
- Navigates to `/login` on Back to Login click

#### With Tokens in URL (5 tests)
- Shows password form
- Shows confirm password field
- Shows Update Password button
- Shows "Set a new password" heading
- Cleans hash from URL on mount

#### Validation (3 tests)
- Error for password < 8 characters
- Error for mismatched passwords
- Error for empty password

#### Successful Reset (4 tests)
- Calls `setSession()` with correct tokens
- Calls `updateUser()` with new password
- Shows success message
- Shows "log in" link after success

#### Error Handling (3 tests)
- Shows error when `setSession` fails
- Shows error when `updateUser` fails
- Resets status to idle on error

---

## API Route Tests — Detailed

All API tests import route handlers directly and call them with mock `NextRequest` objects. `fetch` is globally mocked using `vi.fn()`.

### `api/auth-validate.test.ts`

Tests [app/api/auth/validate/route.ts](../app/api/auth/validate/route.ts).

| Test | Status | What it verifies |
|------|--------|-----------------|
| Missing userId | 400 | Body validation |
| Missing Supabase URL | 500 | Config check |
| Missing service role key | 500 | Config check |
| User not found in Supabase | 401 | Invalid token |
| Valid user data returned | 200 | Success path |
| Status from app_metadata | 200 | Correct status mapping |
| Status fallback to user_metadata | 200 | Metadata priority |
| Status defaults to "pending" | 200 | Missing metadata default |
| Role from app_metadata | 200 | Correct role mapping |
| Role fallback to user_metadata | 200 | Metadata priority |
| Role defaults to "agent" | 200 | Missing metadata default |
| isAdmin from app_metadata | 200 | Admin flag |
| isAdmin defaults to false | 200 | Missing flag default |
| Unexpected error | 500 | Error handling |
| Calls correct Supabase URL | — | `/auth/v1/admin/users/{id}` |

---

### `api/auth-forgot-password.test.ts`

Tests [app/api/auth/forgot-password/route.ts](../app/api/auth/forgot-password/route.ts).

| Test | Status | What it verifies |
|------|--------|-----------------|
| Missing email | 400 | Required field |
| Empty email | 400 | Empty string rejection |
| Invalid email format | 400 | Regex validation |
| Email without domain | 400 | Partial email |
| Missing Supabase config | 500 | Config check |
| Valid email → generic success | 200 | Success path |
| Supabase fails → still generic success | 200 | **Anti-enumeration** — same response regardless |
| Calls recovery endpoint | — | Correct URL called |
| Includes redirect_to param | — | URL contains redirect |
| Service role key in auth header | — | Auth header set |
| Unexpected error | 500 | Network failure |

---

### `api/users-create.test.ts`

Tests [app/api/users/create/route.ts](../app/api/users/create/route.ts). `sendWelcomeEmail` is mocked.

| Test | Status | What it verifies |
|------|--------|-----------------|
| No auth header | 401 | Header required |
| Missing email | 400 | Required field |
| Missing name | 400 | Required field |
| Missing extension | 400 | Required field |
| Invalid role (`"superuser"`) | 400 | Role validation |
| Non-numeric extension (`"abc"`) | 400 | Extension validation |
| Extension with special chars (`"10-1"`) | 400 | Numeric-only check |
| Missing Supabase config | 500 | Config check |
| Successful creation | 200 | User created |
| Defaults to agent role | 200 | Default role |
| Accepts admin role | 200 | Valid role accepted |
| Calls Supabase admin users endpoint | — | POST `/auth/v1/admin/users` |
| email_confirm is true | — | Auto-confirms email |
| Sends createdBy in app_metadata | — | Admin ID tracked |
| Calls sendWelcomeEmail correctly | — | Email sent with right data |
| Succeeds even when email fails | 200 | Email failure doesn't block creation |
| Supabase 422 error | 500 | Downstream error handling |
| Network error | 500 | Unexpected error |

---

### `api/users-pending.test.ts`

Tests [app/api/users/pending/route.ts](../app/api/users/pending/route.ts).

| Test | Status | What it verifies |
|------|--------|-----------------|
| No auth header | 401 | Header required |
| Missing Supabase URL | 500 | Config check |
| Returns processed users | 200 | User list returned |
| Admin user mapped correctly | 200 | role, isAdmin, name set |
| isPendingUser = true for pending agents | 200 | Pending flag logic |
| isPendingUser = false for admins | 200 | Admins never pending |
| Falls back to email prefix for name | 200 | Missing name handling |
| Includes raw metadata | 200 | raw_app_meta_data included |
| Supabase API failure | 500 | Error handling |
| Network error | 500 | Error + message |
| Empty users array | 200 | Empty state |
| Calls admin users endpoint | — | GET `/auth/v1/admin/users` |

---

### `api/users-promote-admin.test.ts`

Tests [app/api/users/promote-admin/route.ts](../app/api/users/promote-admin/route.ts).

| Test | Status | What it verifies |
|------|--------|-----------------|
| No auth header | 401 | Header required |
| Self-modification (same userId) | 403 | Prevents self-promote/demote |
| Missing Supabase config | 500 | Config check |
| Promote to admin | 200 | `isAdmin: true`, message |
| Demote from admin | 200 | `isAdmin: false`, message |
| Sets role to "super-admin" on promote | — | app_metadata.role correct |
| Sets role to "agent" on demote | — | app_metadata.role correct |
| Updates user_metadata.role too | — | Both metadata updated |
| Calls correct Supabase URL | — | PUT `/auth/v1/admin/users/{id}` |
| Includes timestamp in response | — | Audit field |
| Supabase API failure | 500 | Error handling |
| Network error | 500 | Error handling |

---

### `api/users-update-metadata.test.ts`

Tests [app/api/users/update-metadata/route.ts](../app/api/users/update-metadata/route.ts).

| Test | Status | What it verifies |
|------|--------|-----------------|
| Missing userId | 400 | Required field |
| Missing Supabase config | 500 | Config check |
| Successful update | 200 | Success message |
| Sends app_metadata + user_metadata | — | Both payloads sent |
| Calls correct Supabase endpoint | — | PUT `/auth/v1/admin/users/{id}` |
| Service role key in headers | — | Auth + apikey headers |
| Includes timestamp in response | — | Audit field |
| Returns userId in response | — | Response includes userId |
| Supabase API failure | 500 | Error handling |
| Network error | 500 | Error handling |

---

### `api/action-items.test.ts`

Tests [app/api/action-items/route.ts](../app/api/action-items/route.ts).

#### POST (11 tests)
| Test | Status | What it verifies |
|------|--------|-----------------|
| Missing audio_file_id | 400 | Required field |
| Missing extension | 400 | Required field |
| Missing date | 400 | Required field |
| Missing todoItems | 400 | Required field + error message |
| Missing Supabase config | 500 | Config check |
| Creates new record (none existing) | 200 | Insert path |
| Updates existing record | 200 | Update path |
| Uses PATCH for update | — | HTTP method correct |
| Check fetch failure | 400 | Error propagated |
| Column error details in response | — | Error message includes "column" |
| Insert failure | 500 | Error handling |
| Update failure | 500 | Error handling |
| Network error | 500 | Catch block |

#### GET (10 tests)
| Test | Status | What it verifies |
|------|--------|-----------------|
| Missing audio_file_id | 400 | missing array contains it |
| Missing extension | 400 | missing array contains it |
| Missing date | 400 | missing array contains it |
| All params missing | 400 | missing has 3 items |
| Detailed missing field list | — | provided params in response |
| Missing Supabase config | 500 | Config check |
| Returns data when record found | 200 | data = first record |
| Returns null when no record | 200 | data = null |
| Fetch failure | 500 | Error handling |
| Column error in response | — | Error message includes "column" |
| Network error | 500 | Catch block |

---

### `api/action-items-bulk.test.ts`

Tests [app/api/action-items/bulk/route.ts](../app/api/action-items/bulk/route.ts).

| Test | Status | What it verifies |
|------|--------|-----------------|
| Missing extension | 400 | missing array |
| Missing call_date_start | 400 | missing array |
| Missing call_date_end | 400 | missing array |
| All params missing | 400 | 3 items in missing |
| provided params in error | — | Error response structure |
| Missing Supabase config | 500 | Config check |
| Returns data array with count | 200 | data + count fields |
| Returns empty array | 200 | Empty state |
| Correct Supabase query URL | — | gte/lte range filters |
| Supabase failure | 500 | Error handling |
| Column error message | — | Includes "column" |
| Network error | 500 | Catch block |

---

## E2E Tests — Detailed

E2E tests run against the live development server (`http://localhost:3000`). All API calls are intercepted by Playwright's `page.route()` — **no real requests reach Supabase or SendGrid**.

### `e2e/login.spec.ts` (14 scenarios)

| Scenario | What it verifies |
|---------|-----------------|
| Login form visible on page load | Form, inputs, button all visible |
| Email input accepts text | Input works |
| Password input accepts text | Input works |
| Validation error on empty email blur | Error message appears |
| Validation error on empty password blur | Error message appears |
| Forgot password link visible | Link rendered |
| Forgot password opens dialog | Dialog appears |
| Dialog has cancel button | Button visible |
| Dialog has send reset link button | Button visible |
| Cancel closes dialog | Dialog disappears |
| Loading state shows "Logging in..." | Button text changes during request |
| Error on invalid credentials | Error notification shown |
| Admin login → `/dashboard` redirect | Role-based routing |
| Agent login → `/agent` redirect | Role-based routing |
| Pending login → `/pending-approval` redirect | Pending flow |
| Home page (/) shows login form | Root route |

---

### `e2e/forgot-password.spec.ts` (7 scenarios)

| Scenario | What it verifies |
|---------|-----------------|
| Opens forgot password dialog | Dialog visible |
| Dialog contains email input | Placeholder visible |
| Dialog contains description text | Instructions visible |
| Pre-fills email from login form | Email value carried over |
| Cancel closes dialog | Dialog disappears |
| Shows success on valid email submission | Dialog closes after submit |
| Shows sending state during API call | "Sending..." text appears |
| Shows error on API failure | Error message in dialog |

---

### `e2e/dashboard-navigation.spec.ts` (8 scenarios)

| Scenario | What it verifies |
|---------|-----------------|
| Admin lands on `/dashboard` | Correct redirect after login |
| Agent lands on `/agent` | Correct redirect after login |
| Dashboard page has content | No blank page / crashes |
| Agent page has content | No blank page / crashes |
| Signup page shows redirect message | Signup disabled for self-signup |
| Pending approval page loads | Page renders |
| Pending approval shows status info | Content visible |
| Pending approval has back-to-login option | Navigation option |
| Reset password without tokens shows invalid | Error message |
| Reset password back-to-login navigates | Goes to `/login` |

---

### `e2e/user-management.spec.ts` (12 scenarios)

> **Read-Only**: No users are created, promoted, or deleted in these tests. All API responses are mocked.

| Scenario | What it verifies |
|---------|-----------------|
| User management page loads | Heading visible |
| Displays user count (3) | Count badge correct |
| Displays user names | All 3 names in table |
| Displays user emails | Emails visible |
| Shows Add User button | Button visible |
| Shows "You" for current user | Self-identification |
| Add User opens modal | Modal appears |
| Modal has required fields | All fields rendered |
| Modal has cancel button | Cancel visible |
| Cancel closes modal | Modal disappears |
| Table has Name column | Header visible |
| Table has Email column | Header visible |
| Table has Role column | Header visible |

---

## Coverage Targets

| Area | Target | Critical |
|------|--------|---------|
| `store/auth/store.ts` | 90%+ | Yes |
| `app/api/**` | 85%+ | Yes |
| `components/auth/**` | 80%+ | Yes |
| `components/admin/**` | 80%+ | Yes |
| `lib/**` | 90%+ | Yes |

---

## Troubleshooting

### Tests fail with "Cannot find module '@/...'"

The `@` alias is configured in `vitest.config.ts`. Make sure you haven't moved files without updating the alias path.

### Component tests fail with "matchMedia is not a function"

This is mocked in `__tests__/setup.ts`. Make sure setup file is correctly referenced in `vitest.config.ts`.

### E2E tests fail with "page.route is not a function"

Playwright version compatibility. Run `npx playwright install` to ensure browsers are installed.

### E2E "Timeout exceeded" errors

The dev server must be running (`npm run dev`) before E2E tests. The `playwright.config.ts` has `reuseExistingServer: true` — it will start one if needed.

### Zustand store state leaks between tests

Each test calls `resetStore()` via `useAuthStore.setState(...)`. If a test fails mid-way, the store might retain state. The `beforeEach` block in `auth-store.test.ts` handles this.

### "Top-level await" errors in test files

API route test files use top-level `await import(...)`. This requires Vitest with `globals: true` (already configured). If you see this error, check `vitest.config.ts` is loaded.

---

## Key Design Decisions

1. **No data modification** — Every write operation (create user, update metadata, save action items) is mocked. The mocked fetch returns controlled responses without touching Supabase.

2. **Isolated tests** — Each test clears all mocks (`vi.clearAllMocks()`) and resets state in `beforeEach`. Tests do not depend on each other.

3. **Anti-enumeration tested** — The forgot-password route returns the same success message whether the email exists or not. This security behavior is explicitly tested.

4. **Self-modification guard tested** — The promote-admin route returns 403 when `userId === currentUserId`. This security check is tested.

5. **Metadata fallback chain tested** — The metadata mapping logic (`app_metadata` → `user_metadata` → default) is tested at every level in both validate and pending routes.
