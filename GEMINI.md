# Project Instructions: Cocreator Content Studio

## 🏗 Architecture & Conventions

### Tech Stack
- **Frontend**: Next.js 15 (App Router).
- **Backend**: n8n workflows + Next.js API Routes.
- **Database**: Supabase (PostgreSQL + Realtime).
- **Styling**: Tailwind CSS (Lucide Icons for UI).

### Folder Conventions
- `dashboard/`: Primary workspace for the Next.js app.
  - `src/app/board/`: Module for the Team Board (Trello-style).
- `workflows/`: Exported n8n workflows (JSON/JS).
- `scripts/`: Python utility scripts. Use `scripts/venv` for execution.
- `docs/`: All documentation.
- `credentials/`: Local secrets (Ignored by Git).

### Coding Standards
- **Surgical Edits**: Prefer `replace` over `write_file` for existing components.
- **Type Safety**: Ensure TypeScript interfaces in `dashboard/src/services/` and `dashboard/src/store/` are updated when API payloads change.
- **Realtime Sync**: Always consider Supabase Realtime when implementing features that involve background processing (n8n workers).
- **DND Best Practices**: Use `Portal` for dragging items in `@hello-pangea/dnd` to avoid layout breaks caused by parent transforms/blurs.

## 🛠 Workflows

### Board & Mural of Ideas
- **Persistence**: Managed via `posicao` (INT) and `status` columns in `mural_ideias`.
- **Realtime**: Table `mural_ideias` must have Realtime enabled in Supabase for instant sync across clients.
- **Components**: Modularized into `Column.tsx` and `TaskCard.tsx` in `dashboard/src/app/board/components/`.

### Post Initialization
- Posts are initialized via `/api/production` (action: `init_post`).
- Always use `upsert` to handle multi-stage initialization (Briefing -> Scripting -> Editing).

### Asset Sync
- Use `scripts/sync_assets_final.py` to synchronize local images with GCS and Pinecone.

## 📝 Documentation
- Reference `docs/ROADMAP_DESENVOLVIMENTO.md` for current project status.
- Update `docs/CHECKLIST.md` after completing major features.
