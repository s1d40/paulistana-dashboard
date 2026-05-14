# Cocreator Content Studio

Autonomous content production factory combining Next.js, n8n, Supabase, and AI.

## 📁 Project Structure

This project is organized into several key modules:

- **`dashboard/`**: A Next.js (TypeScript) application providing the user interface for the Content Studio, including the Scriptwriter Cockpit and Timeline Editor.
- **`workflows/`**: n8n workflow exports (JSON/JS) that power the back-end automation for script generation, asset synchronization, and video compilation.
- **`scripts/`**: Utility Python/Bash scripts for asset synchronization, database updates, and GCS uploads.
- **`docs/`**: Consolidated project documentation, architectural specs, roadmaps, and historical reports.
- **`credentials/`**: (Ignored) Secure storage for service accounts and API tokens.
- **`archive/`**: Legacy data files, CSVs, and temporary assets.
- **`images/` & `assets_sync_final/`**: Local storage for raw and processed image assets.

## 🚀 Key Features

- **Live Cockpit**: Interactive chat for drafting content scripts with real-time feedback.
- **n8n Integration**: Event-driven production pipeline triggered by dashboard actions.
- **Asset Sync**: Automatic synchronization between Google Cloud Storage, Pinecone (vector search), and Supabase.
- **Timeline Editor**: Visual tool for refining generated content before final export.

## 🛠 Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, Lucide Icons, Zustand.
- **Backend Automation**: n8n.io.
- **Database**: Supabase (PostgreSQL + Realtime).
- **Vector Search**: Pinecone.
- **AI Models**: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro (configurable via Cockpit).

## 📖 Getting Started

1. **Dashboard**: Navigate to `dashboard/`, install dependencies with `npm install`, and run `npm run dev`.
2. **n8n**: Ensure your n8n instance is running and configured with the webhooks found in `.env.local`.
3. **Environment**: See `dashboard/.env.local.example` for required configuration.

---
*For detailed architectural insights, check `docs/SYSTEMS_ENGINEER_REPORT.md` and `docs/ROADMAP_DESENVOLVIMENTO.md`.*
