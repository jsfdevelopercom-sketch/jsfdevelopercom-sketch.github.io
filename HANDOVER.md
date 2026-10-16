# Public host navigation — 16 October 2026

The owner requested one SiliconDoctor brand, Home / Tools / Cases tabs, and APACHE II, Sheet records and help inside Menu. The embedded app owns its own header; this host hides its masthead while the app is visible. When APACHE/Sheets/help is open, the host supplies the same three primary tabs and a Menu. No calculator or Sheet save logic was changed.

A trusted `SILICONDOCTOR_HOST_PANEL_V1` message opens only the three allowlisted panels, preserving the existing clinical iframe. Both exact child origin and source window must match. Home/Tools/Cases explicitly open the intended app route. Existing automatic resume, immersive chat, calculator draft and release-update protection are retained. Deep links `?panel=form`, `controls`, `help` open the corresponding host page.

Local host Chromium checks PASS: 21 viewport/accessibility checks with axe-core4.10.3, calculator draft/scoring smoke, trusted Menu/iframe preservation, spoofed immersion rejection and busy update protection. Evidence is under docs/evidence/simple-navigation-20261016. Coordinated app navigation, combined browser tests and release receipts are recorded in the canonical backend running handover below. Follow the exact commit/CI/deployment receipts there; do not infer a deployment from this document alone.

Canonical running PDF: https://github.com/jsfdevelopercom-sketch/silicondoctor-aidoc-backend/blob/main/docs/handover/latest.pdf

Coding plan and progress: https://github.com/jsfdevelopercom-sketch/silicondoctor-aidoc-backend/issues/359

Use `AXE_PATH=/path/to/axe.min.js node tests/host-layout.cjs /path/to/chromium` to repeat the host check. Clinical calculations, source qualification and patient-linked tool results are separate backend tasks; all 848 imported registry entries remain discovery-only. Preserve this handover and update the canonical PDF after each subsequent coding milestone. Do not put client credentials, patient data or screenshots into handovers.
