# SIH26018 — Intelligent Land Record Digitization and Validation System

This project is a Next.js 16 App Router application built for the Smart India Hackathon. It leverages Google's Gemini 1.5 Flash Multimodal AI to intelligently extract, translate, and digitize regional land records (like Khasra/Khatauni) into a structured, easily verifiable database.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase (Postgres, Row Level Security, Auth, Storage)
- **AI/ML:** Google Generative AI (`gemini-flash-latest`)
- **Styling & Components:** Tailwind CSS, shadcn/ui, Zustand

## Processing Pipeline
1. **Upload:** A Verification Officer uploads a scanned land record (image/PDF) to the dashboard. The file is stored securely in a Supabase bucket.
2. **Extraction:** The file is passed to Gemini 1.5 Flash along with a strict prompt to extract the Owner Name, Khasra Number, Land Area, and Village, regardless of the regional language (e.g., Hindi).
3. **Cross-Verification (Fraud Engine):** The extracted data runs through deterministic checks. It flags missing required fields or mathematically impossible land areas. It also queries the `land_records` database to detect duplicate Khasra numbers in the same village.
4. **Human-in-the-Loop Validation:** The Officer views the original document side-by-side with the extracted JSON, correcting any mistakes.
5. **Audit Trail:** Upon clicking "Verify", any corrections made by the Officer are written to an immutable `audit_events` table for complete traceability.

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 2. Database Migration
Run the following SQL files sequentially in your Supabase SQL Editor:
1. `supabase/schema.sql` (Creates core tables and storage)
2. `supabase/migrations/002_security_and_audit.sql` (Enables Row Level Security, Soft Deletes, and Audit Events)

### 3. Setup Test User
To use the Officer Dashboard, you need an authenticated account. Run the setup script to create a user and assign them the `VERIFICATION_OFFICER` role:
```bash
node scripts/create-user.mjs
```
*(You can log in at `/login` with `officer@india.gov.in` and `password123`)*

### 4. Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.
