# Jules Instructions: Cocreator Studio Expansion

Hello Jules! You are joining the Cocreator Studio project. This system is an automated content creation studio built with Next.js (App Router), Supabase (PostgreSQL + Realtime), and Python workers (for media generation). 

The base system is currently fully functional for a single niche (ecommerce products), but our vision is to **massively expand the system into a Multi-Account and Multi-Niche Hub**.

Your goal is to help us implement this expansion, optimize existing tools, and integrate new content formats. 

Here is everything you need to know and the tasks you should tackle.

---

## 🏗 Architecture Overview

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Zustand for state management.
- **Backend APIs:** Next.js API Routes (`/api/*`).
- **Database:** Supabase (PostgreSQL). We use `posts`, `production_batches`, `imagens`, `audios`, and `cenas` tables.
- **Workers:** Python scripts (inside `scripts/`) run via PM2 to handle heavy tasks (FFmpeg video compilation, TTS, image generation).
- **External Tools:** We have standalone tools like `carrossel-tool/` that need to be integrated into the main dashboard.

---

## 🎯 Your Priority Tasks

### 1. Architect a Multi-Account & Multi-Niche Hub
Currently, the system is tied tightly to physical products ("Paulistana Emporio"). We want to pivot to a model where the dashboard can manage multiple accounts across entirely different niches (e.g., Astrology, Mysteries, Success Stories).
- **What to do:** Adapt the dashboard UI and backend logic so users can switch between different niches. 
- **Goal:** The "Products" or "Offers" should load dynamically based on the selected account's niche. A user should be able to manage an Astrology TikTok account just as easily as an Ecommerce Instagram account.

### 2. Integrate Carousel and Blog Tools
We want to support new content formats beyond video. We have a standalone carousel creation tool located in the `/carrossel-tool` directory.
- **What to do:** Study how the `carrossel-tool` works. Port its functionality into the main Next.js dashboard. 
- **Goal:** Create a "Carousel Studio" and a "Blog Studio" inside the dashboard. Users should be able to generate carousels and blog posts in the staging area just like they do with videos today.

### 3. Optimize the Video Studio System
The current video production staging area (`/src/app/production/[[...id]]/page.tsx`) works well but handles a lot of state and API polling.
- **What to do:** Review the video studio's logic. Implement performance optimizations. 
- **Goal:** Ensure the system handles parallel processing smoothly (e.g., 50 videos being generated simultaneously). Improve state management, reduce unnecessary renders, and guarantee bulletproof error handling when media workers fail.

---

## 📜 Coding Guidelines for Jules

1. **Don't break existing functionality:** The system is currently working perfectly in production. When refactoring for multi-accounts, ensure backward compatibility with the existing DB schema unless a migration is explicitly planned.
2. **Use Surgical Edits:** When modifying large files (like `page.tsx`), avoid completely rewriting them. Hook into the existing Zustand stores and UI patterns.
3. **Styling:** We use Tailwind CSS. Maintain the premium, dark-mode-first aesthetic (vibrant indigo/emerald accents, glassmorphism, clean layouts).
4. **Supabase:** Leverage Supabase Realtime where appropriate to reduce manual polling.

You can begin by reviewing `dashboard/src/app/production/[[...id]]/page.tsx` and the `/carrossel-tool` folder. We look forward to your contributions!
