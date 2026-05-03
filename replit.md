# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a Next.js school management portal for Scholars Modern Institute (SMI) Arawani, backed by Firebase.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (api-server artifact)
- **Database**: PostgreSQL + Drizzle ORM (api-server), Firebase Firestore (SMI portal)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (api-server), Next.js static export (smi-website)

## Artifacts

### SMI Arawani School Portal (`artifacts/smi-website`)
- **Framework**: Next.js 15 (App Router, TypeScript, static export)
- **UI**: Material UI (MUI) v6 + MUI X DataGrid
- **Auth**: Firebase Authentication (email/password)
- **Database**: Firebase Firestore
- **Pages**: Login, Dashboard, Students, Teachers, Exams, Charges
- **Preview path**: `/`
- **Dev port**: 23417

#### Firebase Configuration
Edit `artifacts/smi-website/.env.local` with real Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### API Server (`artifacts/api-server`)
- **Framework**: Express 5
- **Preview path**: `/api`
- **Dev port**: 8080

### Mockup Sandbox (`artifacts/mockup-sandbox`)
- Canvas design sandbox
- **Preview path**: `/__mockup`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/smi-website run dev` — run SMI school portal locally

## Features (SMI Portal)

- **Login**: Firebase Auth email/password login required
- **Dashboard**: Analytics overview (student counts, teacher counts, fee totals, charts by class)
- **Students**: Add/edit/delete students with class, section, roll number, parent info
- **Teachers**: Add/edit/delete teachers with subject, qualification, salary info
- **Exams**: Schedule and manage exams with type, class, subject, date, marks
- **Charges**: Track fee payments with status (pending/paid), mark as paid, filter by status

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
