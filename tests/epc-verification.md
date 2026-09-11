# EPČ verification

The supplied PDF has 132 page widgets and eight separate canonical field objects with duplicate names and no Parent/Kids link. Reattaching those widgets would introduce ambiguous fields. The implementation removes their values/appearances from the reusable page, keeps the original vector page content, extracts every original rectangle into geometry.json, and generates a new unambiguous field tree on export (62 real checkboxes, 62 editable time fields and four header/signature fields).

- Model tests: service completion in Bratislava time, future automatic entries, manual overrides, removed/suggested records, second-column identity, exact/custom ranges including 24:00, invalid ranges.
- PDF tests: original A4 dimensions, Unicode name, all field rectangles, logical values and nonempty appearance objects. Python verification separately follows Parent relationships and compares every widget state with canonical values. PDF renders were visually inspected.
- Browser integration ran against a separate local PostgreSQL-compatible PGlite database, using the actual Next routes and server actions. It checked second service only, custom IP, clearing and reloading, invalid times, 24:00, signature persistence, month switching and export. No production records were used for test writes.
- All 124 row controls matched the source coordinates within 0.05 PDF points at viewport widths 320, 390 and 1440 and zoom 100%, 200%, 300%. Document did not overflow; the form itself scrolls when zoomed.
- Signature/ensemble storage is keyed by employee, year and zero-based month. An additive idempotent epc_report table stores metadata; time_entry records are retained. Legacy local signatures for the previous single-user account are imported only if the server has no signature, keeping the original local copy. Slot tags in entry notes prevent a second-column entry moving into column one. Month-level transaction locks serialize filling and edits without deleting existing records.

Run pure tests with `pnpm dlx tsx tests/epc-model.test.ts` and `pnpm dlx tsx tests/epc-pdf.test.ts`. Validate exported PDFs with `python tests/verify-epc-fields.py path/to/export.pdf`. Storage test deliberately refuses anything except the isolated local test database and expects the browser fixture to have been saved first.

The project has pre-existing TypeScript errors in app/page.tsx and components/language-provider.tsx; the production build currently skips type validation. No new type errors were found in the EPČ implementation. Full build passed.
