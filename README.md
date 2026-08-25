# SIH26018 — Intelligent Land Record Digitization and Validation System

**Smart India Hackathon 2026 - Internal Round Pitch**

## 🚨 The Problem Statement (SIH26018)
India's legacy land records (Khasra, Khatauni) are predominantly physical, hand-written, and in regional languages. This leads to massive inefficiencies, data loss, and high susceptibility to property fraud. Manual digitization is slow, error-prone, and lacks real-time verification against existing government databases.

## 💡 Our Solution
An end-to-end AI-powered digitization pipeline. We leverage Google's Gemini 1.5 Flash Multimodal AI to instantly extract, translate, and digitize regional land records. Our system doesn't just digitize; it actively fights fraud by cross-verifying extracted data against a mock Government Land Record Management System (LRMS) database in real-time.

## 🏗️ Architecture & Tech Stack
- **Frontend & API:** Next.js 16 (App Router, Turbopack) deployed on Vercel.
- **Database & Auth:** Supabase (Postgres with strict Row Level Security, Supabase Auth, Secure Storage Buckets).
- **AI/ML Extraction:** Google Generative AI (`gemini-flash-latest`) handling multilingual OCR and complex spatial layout understanding.
- **Analytics:** Recharts for real-time visualization of digitization progress and error rates.
- **Styling:** Tailwind CSS + Shadcn UI with premium Glassmorphic design.

## ✨ Key Features
1. **Multilingual AI Extraction:** Instantly reads Hindi/Regional documents, translates values to English for the database, but preserves the original raw text for human verification.
2. **Real-time Fraud Engine:** Automatically cross-checks extracted Khasra numbers, Owner Names, and Plot Areas against a mock government database. Flags duplicates and forged records instantly.
3. **Strict Role-Based Access Control (RBAC):** Postgres Row Level Security guarantees that only `DIGITIZATION_OPERATOR`s can upload, and only `VERIFICATION_OFFICER`s can verify.
4. **Immutable Audit Trails:** Every correction made by a human officer is permanently logged in an `audit_events` table (Actor ID, Old Value, New Value, Timestamp).
5. **Dynamic Dashboard:** Real-time visualization of pipeline status, district-wise progress, and AI confidence error rates.

## 🚀 Live Demo Script (For Internal Round)
*Tip for Presenters: Keep this flow in mind when presenting to the internal panel.*

**Step 1:** Open the Dashboard and show the clean UI.
**Step 2:** Click **Upload Document**. Upload `sample_hindi_record.txt`.
**Step 3:** Explain that the AI is translating and structuring the regional document.
**Step 4:** Arrive at the Verification Page. Show how the Fraud Engine successfully flagged the document in RED because the Khasra number doesn't match the government database!
**Step 5:** Upload `sample_land_record.txt` (English). Show how it glows GREEN with 0 warnings because it perfectly matches the government records.
**Step 6:** Hit "Confirm & Verify" to show how the data is securely saved and the Dashboard charts update dynamically.

## 🛠️ Local Setup Instructions (For Judges)

### 1. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 2. Database Migration (Crucial)
Run these SQL files sequentially in your Supabase SQL Editor:
1. `supabase/schema.sql` (Core tables and storage)
2. `supabase/migrations/002_security_and_audit.sql` (RLS & Audit Logs)
3. `supabase/migrations/003_advanced_features.sql` (Mock LRMS Fraud Database & Constraints)
4. `supabase/migrations/004_strict_rbac.sql` (Role-Based Access Control)
5. `supabase/migrations/005_seed_demo_data.sql` (Creates test accounts and populates dashboard)
6. `supabase/migrations/006_fix_auth_and_roles.sql` (Links Auth UUIDs to Profiles for smooth demoing)

*Note: Before your live pitch, run `supabase/migrations/007_clear_demo_data.sql` to instantly wipe the dashboard clean while keeping your accounts active.*

### 3. Run Locally
```bash
npm install
npm run dev
```
Log in using `officer@india.gov.in` and `password123`.

## 🔮 Future Scope (Post-Internal Round)
- **Offline OCR Fallback:** Integrate PaddleOCR/Tesseract for on-premise extraction before hitting the LLM.
- **GIS Integration:** Connect extracted Khasra numbers to Bhuvan APIs to visualize land parcels on a map.
