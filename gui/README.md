# PRISM | Explainable ICU Mortality Risk Assessment

A client-only React + TypeScript application that runs a validated XGBoost
model directly in the browser to estimate in-hospital ICU mortality risk,
with a real-time, factor-level explanation of each prediction.

## Getting started

```bash
npm install
npm run dev      # start local dev server
npm run build    # production build (outputs to dist/)
npm run preview  # preview the production build locally
```

## Project structure

```
src/
  components/
    calculator/     CalculatorView, FormGroup, ResultPanel
    dashboard/       DashboardView, ChartCard, ListCard, StatRow
    TopBar.tsx        App header and tab navigation
    SectionIntro.tsx  Reusable heading component
    ReportModal.tsx   Printable report preview modal
  engine/
    predictEngine.ts  Client-side XGBoost tree evaluation
    adviceEngine.ts   Risk tiering and clinical recommendations
    reportBuilder.ts  HTML report generation
  data/
    model.json        Exported trained model (trees, preprocessing params)
    fields.ts          Patient input field definitions
    examples.ts         Example patient presets
    dashboardData.ts   Model evaluation results for charts
  types/
    index.ts           Shared TypeScript types
```

## Notes

- No backend, database, or network request is used at any point — all
  computation happens client-side in the browser.
- `model.json` was exported directly from a validated Python training
  pipeline (scikit-learn / XGBoost); prediction outputs were confirmed to
  match the original model to within floating-point precision.
- Styled with Tailwind CSS v4 using a custom `@theme` token set (see
  `src/index.css`) rather than a `tailwind.config.js` file.
