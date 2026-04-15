# サイズ - Saizu

An interactive Web Application for managing clothing sizes and reference images through a sleek, minimalistic SVG Mannequin interface.

## Core Features
1. **Interactive SVG Avatar:** High-performance, cleanly-coded SVG with interactive hitboxes and fluid CSS transform scaling for seamless zooming onto the selected zone.
2. **WebP Optimization:** Uploaded images are instantly rendered into an in-memory Canvas element and re-exported as optimized WebP data, dramatically reducing payload memory footprints.
3. **Multi-Outfit State:** Effortlessly switch between CASUAL and FORMAL modes. Configurations are held in an isolated context structure.
4. **Minimalistic Japanese Aesthetic:** Strictly adheres to a monochromatic "All-White" theme with soft off-white shadows, utilizing `Noto Sans JP` and `Shippori Mincho` via Google Fonts.

## Deployment to Vercel
This project is built using React + Vite, creating an ultra-lightweight and highly optimized static bundle.
1. Push this repository to GitHub.
2. In the Vercel dashboard, click **Add New Project**.
3. Select the repository from GitHub.
4. The Build Settings will automatically detect **Vite** (Framework Preset: Vite, Build Command: `npm run build`, Output Directory: `dist`).
5. Click **Deploy**.

## Local Development
Requires Node.js installed.
```bash
# Install dependencies
npm install

# Start Local dev server
npm run dev
```
