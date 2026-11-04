# amaanomar.com

Astro (static) + a React island running react-three-fiber/drei for the hero. Deployed on Netlify (`netlify.toml`).

```
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
```

- Brand tokens: `src/styles/tokens.css` (colours, type, shape, motion). Fonts: Google Fonts link in `src/layouts/Base.astro`.
- 3D: `src/components/HeroArt.tsx` (lazy loader + static fallback for reduced motion / no WebGL), `HeroScene.tsx` (the scene).
- Contact form: Netlify Forms (`contact`), thank-you page `/success/`.
