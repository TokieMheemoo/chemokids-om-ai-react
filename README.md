# ChemoKids OM-AI React

Mobile-first prototype for assessing possible oral mucositis symptoms in pediatric oncology patients.

> Important: this app is a prototype decision-support/demo tool only. It is not a medical diagnosis system and must not replace clinical judgment.

## Tech stack

- React
- TypeScript
- Vite
- CSS
- Vercel deployment

## Local development

```bash
npm install
npm run dev
```

## Production build check

Run this before pushing to GitHub/Vercel:

```bash
npm run build
npm run lint
```

## Current app flow

1. Welcome screen
2. Upload or capture an oral cavity image
3. Answer symptom questions
4. Simulated AI analysis screen
5. Rule-based preliminary result

## Project structure

```text
src/
  components/
    TopBar.tsx
  data/
    questions.ts
  utils/
    evaluateGrade.ts
  App.tsx
  App.css
  index.css
  main.tsx
  types.ts
```

## Recommended next steps

- Add real backend API route for AI-assisted image review.
- Store assessments only after privacy requirements are clear.
- Add export/share report button.
- Add Thai/English language toggle.
- Add stronger clinical disclaimer and emergency guidance.
