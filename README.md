# CallSure

A Next.js web application for viewing and analyzing call logs with role-based dashboards for **admins** (full analytics) and **agents** (personal call history). Includes authentication, user management, and call metrics with charts and action items.

## Features

- **Authentication** — Login, signup (admin-created users), forgot/reset password, email confirmation, and pending-approval flow via [Supabase Auth](https://supabase.com/docs/guides/auth).
- **Admin dashboard** — Calendar view of daily call summaries; drill down by date and type (`all` / `confusions` / `complaints`); call metrics, charts (coverage, direction, frequency), and call details table with search.
- **Agent view** — Same calendar and call-detail experience filtered by the agent’s extension (from user metadata).
- **User management** — Admins can view users, add users, set role (agent/admin/super-admin), set extension, and promote to admin. New signups can be pending until approved.
- **Call analytics** — Total/inbound/outbound counts, average duration, resolution metrics, insurance coverage breakdown, call direction and frequency charts, call details modal with transcript and follow-up/action items.
- **Action items** — API support for saving and bulk-updating follow-up/action items per call (extension, date, audio file).

## Tech Stack

| Category        | Technologies |
|----------------|--------------|
| Framework      | [Next.js 15](https://nextjs.org) (App Router), React 18 |
| Auth & Data    | [Supabase](https://supabase.com) (Auth + REST API) |
| State          | [Zustand](https://github.com/pmndrs/zustand) (auth, dashboard, call-details stores) |
| UI             | [Tailwind CSS](https://tailwindcss.com), [Radix UI](https://www.radix-ui.com), [shadcn/ui](https://ui.shadcn.com)-style components |
| Charts         | [Recharts](https://recharts.org), [ECharts](https://echarts.apache.org) |
| Email          | [SendGrid](https://sendgrid.com) (e.g. password reset) |
| Other          | `date-fns`, `dayjs`, `lucide-react`, `react-toastify`, `sonner`, `html2pdf` / `react-to-print` for exports |

## Project Structure

```
├── app/
│   ├── page.tsx                 # Home (login)
│   ├── login/page.tsx
│   ├── signup/page.tsx          # Redirects to login (admin-only signup)
│   ├── reset-password/page.tsx
│   ├── pending-approval/page.tsx
│   ├── dashboard/                # Admin: calendar + call details by type/date
│   │   ├── page.tsx
│   │   ├── users/page.tsx
│   │   ├── [type]/[date]/       # Call metrics, charts, table
│   │   └── store/
│   ├── agent/                    # Agent: calendar + call details (by extension)
│   │   ├── page.tsx
│   │   └── [type]/[date]/
│   ├── admin/
│   │   └── users/page.tsx        # User management UI
│   └── api/
│       ├── auth/                 # validate, forgot-password
│       ├── users/                # pending, create, update-metadata, promote-admin
│       └── action-items/         # POST, bulk
├── components/
│   ├── auth/                     # LoginForm, SignupForm
│   ├── admin/                    # UserManagement, AddUserModal
│   └── ui/                       # Button, Card, Table, Dialog, etc.
├── store/
│   └── auth/                     # useAuthStore (login, signup, session)
└── lib/                          # utils, emailService
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Install

```bash
npm install
# or: yarn | pnpm install | bun install
```

### Environment variables

Create a `.env.local` (or `.env`) in the project root with:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only; keep secret) |
| `NEXT_PUBLIC_TAB_INFO_TITLE` | Browser tab title |
| `NEXT_PUBLIC_TAB_INFO_DESCRIPTION` | Meta description |
| `NEXT_PUBLIC_LOGIN_LOGO` | Optional logo URL (e.g. for login/pending-approval) |
| `NEXT_PUBLIC_AUDIO_SOURCE_CLIENT` | Audio source shown in the header (`lightspeedvoice` by default; set `ringcentral` for RingCentral clients) |
| `NEXT_PUBLIC_SENDGRID_API_KEY` | SendGrid API key (e.g. password reset emails) |
| `NEXT_PUBLIC_SENDGRID_FROM_EMAIL` | From address for SendGrid |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app (e.g. for links in emails) |
| `NEXT_PUBLIC_PASSWORD_RESET_REDIRECT` | Redirect URL after password reset |

See `.env.backup` in the repo for a template (no values committed).

### Run

```bash
npm run dev
# or: yarn dev | pnpm dev | bun dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll land on the login page; after login, admins are redirected to `/dashboard`, agents to `/agent`.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Next.js with Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Backend / Data

- **Auth & users:** Supabase Auth and (if used) custom user tables or `app_metadata` / `user_metadata` for role, status, extension.
- **Call data:** Supabase REST API; dashboard uses views like `audio_files_summary_view` (by day/month, counts); call details and action items use your Supabase schema (e.g. `action_items` with `audio_file_id`, `extension`, `call_date`).
- **Email:** SendGrid is used for transactional emails (e.g. password reset); configure via the env vars above.

## Deployment

- **Vercel:** The project is set up for deployment on [Vercel](https://vercel.com). Set the same environment variables in the Vercel project, including `NEXT_PUBLIC_AUDIO_SOURCE_CLIENT`.
- **CI:** `vercel-deploy.yml` and `windows-vercel-deploy.yml` show a GitLab CI pattern that deploys to Vercel with per-client env vars (e.g. `NEXT_PUBLIC_SUPABASE_URL_<CLIENT>` and `NEXT_PUBLIC_AUDIO_SOURCE_CLIENT_<CLIENT>`). Adapt as needed for your GitLab/git setup.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
