# 🚀 Engineering Handoff: Satori Image Engine (v1.0)

## 1. Core Infrastructure
- **Base URL:** `https://carrossel-api-647402935964.us-central1.run.app`
- **Primary Endpoint:** `POST /api/v1/generate-slide`
- **Runtime:** Node.js 20 on Google Cloud Run (Serverless).
- **Engine:** Satori (HTML/CSS to SVG) + Resvg (SVG to PNG).

## 2. Integration for Next.js Dashboard
The dashboard acts as a visual "Director." You don't need to handle image processing; just construct the JSON payload.

### Key Logic for Frontend Engineers:
- **Strict Typing:** The API uses **Zod** for validation. See `src/server.ts` for the schema.
- **Auto-Contrast Lock:** If `slideCategory` is set to `hook`, the API automatically forces dark text (`#1A1A1A`) for readability, regardless of what the user selects.
- **Dynamic Highlights:** Use double asterisks in strings (e.g., `"Hello **World**"`) to trigger the highlight color/style.
- **Performance:** Images take ~3-5s to generate due to font loading and Sharp processing. Use loading states in the dashboard.

## 3. Integration for n8n Workflows
The API is designed to be "Agent-First." 

### Workflow Setup:
- **HTTP Request Node:**
    - **Method:** `POST`
    - **URL:** `{{$node["Config"].json["api_url"]}}/api/v1/generate-slide`
    - **Body Parameters:** Send the full JSON.
- **Binary Response:** The API returns `image/png`. In n8n, ensure the "Response Format" is set to "File/Binary" to pass the image to the next node (e.g., Upload to S3, Send to Instagram API).

## 4. Payload "Cheat Sheet" (The Essentials)
| Field | Purpose | Notes |
| :--- | :--- | :--- |
| `backgroundImageUrl` | Visual foundation | Must be a public, high-res URL. |
| `slideCategory` | Logic switch | `hook` (Big text), `body` (Bullets), `cta` (Call to action). |
| `theme.headlineFont` | Typography | Choices: `Montserrat`, `Bebas Neue`, `Poppins`, `Inter`, etc. |
| `overlay.type` | Readability | `bottom-gradient`, `blur-box`, `top-gradient`. Critical for legibility. |
| `layout.anchor` | Composition | `top`, `center`, `bottom`. Controls vertical text flow. |

## 5. Deployment & Scalability
- **CI/CD:** The project contains a `deploy.sh` script.
- **Environment:** To update the API, push to GitHub and run `gcloud builds submit`.
- **Scaling:** Cloud Run handles concurrency automatically. Fonts are cached in memory to speed up subsequent requests.

---
*Documentation stored in `/docs/` for deep dives into Design System and API Reference.*
