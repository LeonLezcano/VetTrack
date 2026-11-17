# VetTrack Design System (`DESIGN.md`)

## 1. Visual Identity & Domain Context
VetTrack is an **Operate-mode** offline-first field tool built for bovine veterinarians, cattle chute operators (*manga*), feedlot managers, and dairy (*tambo*) practitioners in Argentina operating under SENASA regulations.

### Competitive Benchmarking
- **Herdwatch / BovControl / Cattler:** High-density chute data entry relies on oversized tap targets usable with gloved hands, zero multi-step clutter, and immediate status signaling for treatment withholding periods.
- **Field Instrument Ergonomics:** Outdoor sunlight, pickup truck windshield mounts (Screen Wake Lock), and dawn/dusk corral lighting demand high-contrast dark surfaces (`#0d120e`) with luminous emerald confirmation and unambiguous amber/rose quarantine indicators.

### Design Dial
`Dial: ENERGY 4 / RHYTHM 6 / MOTION 2`
- **Energy 4:** Restrained, clinical-industrial precision; color is reserved for actionable controls and sanitary status verdicts.
- **Rhythm 6:** Consistent vertical cadence (`16px` section gaps, `12px` field gaps), flat surfaces separated by `1px` hairlines (`#263329`) without nested card boxes.
- **Motion 2:** Snappy `150ms` state transitions only; zero decorative loops, zero idle pulsing, full `@media (prefers-reduced-motion: reduce)` compliance.

---

## 2. Theme Policy: Dark-Only Field Mode
VetTrack intentionally ships **Dark-Only Field Mode** (unused Tailwind `darkMode: 'class'` is omitted).
- **Rationale:** Reduces battery draw on OLED phones during full-day chute sessions and prevents glare inside vehicle cabs under Screen Wake Lock.
- **Print Exception (`@media print`):** Automatically switches to white paper (`#ffffff`) and black ink (`#000000`), hiding navigation, buttons, and footer (`.no-print`) for clean physical SENASA act archiving.

---

## 3. Palette Tokens (WCAG AA Verified)
- **Surfaces & Neutrals:**
  - `--bg-field`: `#0d120e` (Obsidian Field Ground)
  - `--bg-chrome`: `#0f1510` (Header & Footer Chrome)
  - `--bg-card`: `#161c17` (Panel Surface)
  - `--border-hairline`: `#263329` (1px Structural Divider)
  - `--text-primary`: `#f4f5f4` (Ivory, 15.85:1 on `#161c17`)
  - `--text-secondary`: `#d4d4d8` (Zinc 300, 12.52:1 on `#0f1510`)
  - `--text-muted`: `#a1a1aa` (Zinc 400, 6.76:1 on `#161c17` - minimum muted text token; `zinc-500` is prohibited for readable copy)
- **Core Brand (Bio Emerald):**
  - Primary Action Fill: `#047857` (`bio-700`) with `#ffffff` text (5.48:1 WCAG AA) or `#10b981` (`bio-500`) with `#05130c` text (7.49:1)
  - Accent Headings & Links: `#34d399` (`bio-400`, 9.01:1 on `#161c17`)
  - Active Badge Surface: `#064e3b` (`bio-900`) with `#6ee7b7` (`bio-300`) text (6.38:1)
- **Semantic Status Accents:**
  - Warning / Carencia / 2nd Cycle: Amber (`#451a03` fill, `#fcd34d` text, 10.39:1)
  - Blocked / Quarantine / Empty Cow: Rose (`#4c0519` fill, `#fda4af` text, 8.27:1)

---

## 4. Typography Scale & Font Stack
Zero external font CDNs are used so typography never degrades or stalls offline.
- **Sans / Display:** `system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`
- **Monospace (Data, RFID Tags, Currency, SHA-256 Seals):** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace` with `tabular-nums`.
- **Strict Descending Scale (`>= 1.25x` steps):**
  - `h1` (App Title): `1.75rem` (28px), weight `800`, line-height `1.2`
  - `h2` (Section Title): `1.375rem` (22px), weight `700`, line-height `1.25`
  - `h3` (Subsection Title): `1.125rem` (18px), weight `600`, line-height `1.3`
  - `body`: `0.875rem` (14px), weight `400`, line-height `1.5`
  - `small / label`: `0.75rem` (12px) minimum functional text size (`< 12px` prohibited)

---

## 5. Field Touch Targets & Accessibility
- Every interactive control (`button`, `input`, `select`) implements `.touch-target` (`min-height: 48px`, `min-width: 48px`).
- Viewport allows user pinch-to-zoom (`width=device-width, initial-scale=1.0`).
- Multi-column grids collapse cleanly on mobile (`grid-cols-2 sm:grid-cols-4` for navigation tabs, `grid-cols-1 sm:grid-cols-2` / `grid-cols-1 sm:grid-cols-3` for forms and summaries).
- Every form control binds an explicit `<label for="...">`.
- Keyboard navigation uses high-contrast `:focus-visible` rings (`2px solid #10b981` with `2px` offset); `outline: none` is prohibited.
- Tab navigation implements full `role="tablist"`, `role="tab"`, `aria-selected`, and `role="tabpanel"` semantics.
