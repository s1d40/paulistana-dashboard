# Project State Report: Cocreator Dashboard
**Date:** May 10, 2026
**Scope:** `/dashboard/` folder analysis
**Recipient:** Systems Architect

## 1. Executive Summary
The Cocreator Dashboard has evolved into a sophisticated "Content Command Center." It is no longer just a visualization tool but an operational hub that orchestrates AI content generation (TikTok videos, Instagram carrousels, Blog posts), manages a Headless CMS (Google Sheets), and monitors business performance (GA4, Nuvemshop).

## 2. Technical Stack
- **Framework:** Next.js 16.2.4 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.0
- **State Management:** 
    - **Global:** Zustand (with persistence for AI Presets)
    - **Server State:** TanStack Query (React Query) v5
- **Data Visualization:** Apache ECharts (`echarts-for-react`)
- **AI Integration:** Vercel AI SDK (`ai`, `@ai-sdk/openai`)
- **Backend-as-a-Service:** Supabase (Auth/Database)
- **Utility:** Lucide React (Icons), PapaParse (CSV Parsing), clsx/tailwind-merge.

## 3. Architectural Patterns & Protocols
### 3.1. BFF (Backend-For-Frontend) & Media Protocol
The `/src/app/api` directory implements a BFF pattern. A critical architectural mandate identified in the specs is the **Strict Media Protocol**:
- **Zero-Binary Transit:** Next.js never handles BLOBs or Base64.
- **GCS Centric:** All media is persisted to Google Cloud Storage by n8n.
- **Pointer-Based:** The n8n worker returns exclusively public URLs or JSON errors to the frontend.

### 3.2. Satori Image Engine (Microservice)
The dashboard leverages a specialized microservice for carrousel rendering:
- **Endpoint:** `https://carrossel-api-647402935964.us-central1.run.app`
- **Engine:** Satori (HTML/CSS to SVG) + Resvg.
- **Integration:** The dashboard constructs complex JSON payloads (Satori Schema) which are passed to n8n, rendered by the API, and saved to GCS.

### 3.3. Headless CMS (Google Sheets)
The project uses Google Sheets as a low-cost, high-flexibility CMS.
- **Service:** `src/services/google-sheets.ts` parses public CSV exports using GIDs.
- **Complexity:** Handles cross-referencing between 4 different sheets (Posts, Images, Audios, Videos) using `id_post` as a foreign key.

### 3.4. AI Orchestration & The "Preset Machine"
The dashboard manages complex AI workflows via a tiered Preset system:
- **Locked/Essential Layer:** Rules for JSON structure, TTS limits, and Satori layout (stored in `presetStore.ts` with `isEssential: true`).
- **Editable Layer:** Persona, tone, and CTA inputs for the manager.
- **Execution Logic:** Planned for a **Sequential Execution Queue** to prevent API Rate Limits, though current implementation in `conteudo/page.tsx` is trigger-based.

## 4. Content Frameworks (System Messages)
The project identifies four distinct production tracks, each with specialized "Brain" logic:
1. **Video (TikTok/Reels/Marketplace):** Focuses on "Neuro-Marketing," 9:16 verticality, and "Scroll-Stopper" ganchos. Integrates `Get_Slug_Info` for inventory-aware scripting.
2. **Carrossel (Viral/Satori):** Focuses on cognitive load reduction, using specialized niches (Esoterismo, Saúde, Boho) and the Satori API for dynamic slide rendering.
3. **Blog (SEO/YMYL):** Focuses on "Information Gain," clinical tables, and YMYL compliance (Medical Review Bylines).

## 5. Strategic Roadmap (Status)
### Phase 1: Foundations (Completed ✅)
- [x] Bento Grid Dashboard with GA4/Nuvemshop integration.
- [x] Multimedia Content Library with GCS Players.
- [x] Tiered Preset System (Locked vs Editable sessions).
- [x] Satori Image Engine Microservice deployment.

### Phase 2: Operations (In Progress 🏗️)
- [ ] **Sequential Execution Queue:** Implementing a state-controlled worker to handle "Render" requests one-by-one.
- [ ] **Supabase Sync:** Moving presets from `localStorage` (Zustand) to a shared PostgreSQL table.
- [ ] **Instagram Webhooks:** Finalizing lead capture via DM/Comments in n8n.

### Phase 3: Expansion (Planned 🚀)
- [ ] **TikTok Business API:** Automated video upload and native metric tracking.
- [ ] **Attribution Funnel:** Mapping "Comment → DM → Click → Checkout" conversion data.
- [ ] **Auth & Role Access:** Securing the dashboard via Supabase Auth.

## 6. Directory Mapping & Documentation Index
- `src/app/`: App Router routes and API endpoints.
- `src/components/`: Reusable UI components (Sidebar, ChatPanel, Chart, etc.).
- `src/services/`: Integration layer (Supabase, GA, Nuvemshop, WP).
- `src/store/`: Zustand stores for global persistent state.
- `src/lib/`: Utility functions and database clients.

**Key Technical Documents:**
- `dashboard/PROJECT_STATE_REPORT.md`: This document.
- `dashboard/proximos_passos.md`: Frontend/BFF Technical Specification.
- `dashboard/PLAN_DASHBOARD_REFACTOR.md`: Detailed plan for Preset/Session architecture.
- `SYSTEMS_ENGINEER_REPORT.md`: Satori Image Engine handoff and API reference.
- `ROADMAP_DESENVOLVIMENTO.md`: Business roadmap and next immediate actions.

## 7. Observations & Critical Risks
- **Rate Limit Fragility:** Without the planned sequential queue, rapid manual triggers for "Render" could lead to n8n/AI API failures.
- **Prompt Complexity:** The hardcoded frameworks in `presetStore.ts` make prompt updates difficult without a code deployment.
- **CMS Volatility:** Dependence on Google Sheets CSV exports remains a single point of failure for data integrity.

## 8. Final Recommendations
1. **Prioritize the Execution Queue:** This is the most critical stability fix for the "Content Studio."
2. **Harden the API Layer:** Implement Zod validation and Auth middleware immediately.
3. **Migrate CMS:** Move from Google Sheets to a more reliable source (e.g., Supabase) as soon as the schema stabilizes.
