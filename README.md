# SIH26018 — Intelligent Land Record Digitization and Validation System

This project is a Next.js 16 App Router application built for the Smart India Hackathon. It leverages Google's Gemini 1.5 Flash Multimodal AI to intelligently extract, translate, and digitize regional land records (like Khasra/Khatauni) into a structured, easily verifiable database.

## Architecture

Our solution is built on a highly scalable, serverless architecture optimized for the cloud:

- **Frontend & API:** Next.js 16 (App Router) deployed on Vercel.
- **Database & Auth:** Supabase (Postgres with strict Row Level Security, Supabase Auth, Secure Storage Buckets).
- **AI/ML Extraction:** Google Generative AI (`gemini-flash-latest`) handling multilingual OCR and complex spatial layout understanding.
- **Analytics:** Recharts for real-time visualization of digitization progress and error rates.

## Demo Flow
1. **Login:** Access the secure dashboard using the provided officer credentials.
2. **Upload:** Upload a scanned land record (image/PDF) via the protected upload portal. The file is securely signed and stored in a private Supabase bucket.
3. **Extraction & Validation:** The document is immediately sent to the AI processing pipeline. Raw OCR text is extracted, mapped to 13 specific land record fields, and cross-verified against a mock government LRMS database.
4. **Human-in-the-Loop Review:** The Officer navigates to the verification screen. They are presented with the original document, the raw OCR text layer, and color-coded extracted fields (Green = High Confidence, Red = Low Confidence).
5. **Approval:** The Officer corrects any fields. Upon clicking "Verify", an immutable audit trail is generated for all corrections, and the clean, structured data is saved to the Postgres database.
6. **Analytics:** The dashboard updates in real-time, displaying the new digitization statistics and extraction error rates.

## Validation Rules (Fraud Engine)
The system runs several deterministic checks before human review:
- **Missing Data:** Flags missing critical fields (Owner Name, Khasra Number, Village).
- **Format Sanity:** Flags impossible values (e.g., negative plot areas).
- **Duplicate Detection:** Queries the existing `land_records` table to prevent digitizing the same Khasra number in the same village twice.
- **LRMS Cross-Verification:** Queries a mock government database (`mock_lrms_records`). Flags mismatching Owner Names or Area disparities between the scanned document and the government records.

## Screenshots

| Dashboard Overview | Upload Flow |
| :---: | :---: |
| ![Dashboard Overview](./screenshots/dashboard.png) | ![Upload Document](./screenshots/upload.png) |

| Verification Screen |
| :---: |
| ![Verification](./screenshots/verification.png) |

## Sample Inputs

Test the system with these provided sample files located in the `samples/` directory:
- `samples/sample_hindi_khasra.png` - A standard regional Khasra document.
- `samples/sample_english_record.pdf` - An English digitized record.
- `samples/sample_low_quality_scan.jpg` - A degraded scan to test OCR robustness.

*(Note: These are mock placeholder files in the repository for demo purposes)*

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
3. `supabase/migrations/003_advanced_features.sql` (Adds Mock LRMS tables, duplicate constraints, and immutable audit policies)

### 3. Setup Test User
To use the Officer Dashboard, you need an authenticated account. Run the setup script to create a user and assign them the `VERIFICATION_OFFICER` role:
```bash
node scripts/create-user.mjs
```
> [!WARNING]
> **Local Demo Credentials:** For hackathon demo purposes, you can log in at `/login` with `officer@india.gov.in` and `password123`. These credentials are for local testing only and must be disabled or rotated before any public production deployment!

### 4. Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

## Known Limitations
- The current validation engine uses a simple `toLowerCase().includes()` for fuzzy matching owner names. Real-world Indian names require complex phonetic matching (e.g., Soundex algorithms tailored for Hindi/regional languages).
- The "Raw OCR / Text Layer" is currently generated directly by Gemini Multimodal as part of the JSON response for the MVP.
- Real-time dashboard updates rely on simple React polling rather than Postgres WAL subscriptions (Supabase Realtime) to conserve connections in the free tier.

## Future Scope
- **Offline OCR Fallback:** Integrate PaddleOCR or Tesseract for on-premise, offline text extraction before hitting the LLM for structuring.
- **GIS Integration:** Connect extracted Khasra numbers to real-world GIS polygon data (e.g., Bhuvan APIs) to visualize the land parcel on a map.
- **Regional Language Support UI:** Localize the entire verification dashboard UI into Hindi, Marathi, Bengali, etc., for regional officers.
