---
name: Kinetic Engine
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#005522'
  on-tertiary: '#ffffff'
  tertiary-container: '#00702f'
  on-tertiary-container: '#78f591'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
  display-counter:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system serves personal trainers managing client portfolios and everyday students executing routines inside gyms and at home. The visual tone balances clinical precision with motivational drive: calm, authoritative, and direct. The interface avoids unnecessary decorative flourishes to prioritize readability under high-stress, fast-paced physical training environments (sweat, low gym lighting, hurried movements).

The aesthetic embodies **Functional Modern Minimalism** paired with a utility-first tactile approach. Interfaces are clear and predictable, prioritizing users with low digital affinity through unmistakable tap states, clear visual hierarchies, and frictionless workflows.

Key emotional traits:
- **Empowering & Direct:** Critical feedback, exercise execution, and timers are immediately recognizable.
- **Accessible & Robust:** Touch surfaces strictly preserve a minimum area of 48x48px across all interactive targets.
- **Motivating & Structured:** State transitions (completed sets, dispatched WhatsApp messages, safety alerts) produce definitive visual confirmation.

## Colors

The color architecture is built on high-contrast foundations using a Slate/Gray spectrum to anchor data density and optimize legibility across varied physical environments.

### Core Roles
- **Primary (`#4f46e5` - Indigo):** The operational core. Applied to structural focal points, primary action triggers, active stepper nodes, and core progression indicators.
- **Secondary (`#3b82f6` - Blue):** Informational support, secondary metrics, interactive selection rings, and utility toggles.
- **Tertiary / Success (`#16a34a` / `#22c55e` - Emerald):** Workout completion checkmarks, set confirmations, and direct WhatsApp integrations.
- **Warning / Clinical Alert (`#f59e0b` - Amber):** High-priority notices regarding past injuries, medical contraindications, and anamnesis alerts.
- **Error (`#ef4444` - Rose):** Destructive actions, missed goals, and input validation failures.

### Neutral System & Dual Context Modes
- **Light Context (Trainer Desktop & General Navigation):** Backgrounds transition from canvas `slate-50` (`#f8fafc`) through elevated cards in pure white (`#ffffff`). Borders leverage `slate-200` (`#e2e8f0`), while typography sits on high-contrast `slate-900` (`#0f172a`) and `slate-600` (`#475569`).
- **Dark Mode (Active Workout Execution):** The training PWA shifts into a dedicated dark theme to conserve battery and reduce visual fatigue in indoor gym lighting. Backgrounds drop to deep `slate-900` (`#0f172a`), surfaces shift to `slate-800` (`#1e293b`), borders resolve to `slate-700` (`#334155`), and text elevates to pure white (`#ffffff`) and `slate-300` (`#cbd5e1`).

## Typography

The type system is built with **Inter** across all display, body, and utility levels to ensure instant legibility regardless of viewport scale or ambient backlight.

### Scaling & Legibility Rules
- **Headline Scales:** Headlines utilize Bold (700) and ExtraBold (800) cuts with slight negative tracking (`-0.01em` to `-0.02em`) to maintain tight, impactful structures on mobile viewports.
- **Readability Anchors:** Mobile equivalents clamp headline sizes at accessible view thresholds (e.g., `headline-xl-mobile` at 28px) to eliminate text overflow and awkward line breaks.
- **Numbers & Metrics:** Weights, rep counts, and rest timers leverage tabular figures (`font-variant-numeric: tabular-nums`) alongside `display-counter` and `headline-lg` styles to keep digital counters aligned without horizontal jitter during active workouts.
- **Labels:** Small labels (`label-sm`) default to uppercase with positive letter spacing (`0.05em`) for anatomical tags, muscle group markers, and badge metadata.

## Layout & Spacing

The layout philosophy uses a **12-column adaptive fluid grid** for trainer dashboards and an **ergonomic single-column container** for the student mobile PWA.

### Structural Flow & Breakpoints
- **Mobile (< 768px):** Single-column layout. Margin set to `margin` (1rem). Touch regions anchor to bottom navigation bars and floating footers for one-handed operation.
- **Tablet (768px - 1024px):** 8-column layout. Gutters expand to `gutter-md` (1.5rem). Split views organize student rosters alongside routine timelines.
- **Desktop (> 1024px):** 12-column layout. Max container constraint at `1280px` to keep wide dashboards legible. Multi-column routine builder surfaces workout panels, exercise catalogs, and anamnesis previews in parallel.

### Density & Rhythms
- Vertical rhythm follows multiples of 4px and 8px.
- Internal component card padding relies on `space-md` (1rem) for condensed execution metrics and `space-lg` (1.5rem) for workout cards.
- Interactive tap zones enforce minimum dimensions of 48px, utilizing `space-sm` and `space-md` element separation to prevent accidental taps during physical exertion.

## Elevation & Depth

Visual hierarchy relies on crisp borders and functional tonal depth over heavy drop shadows, maintaining readability in high-glare environments.

### Surface Tiers
- **Tier 0 (Canvas Base):** `slate-50` (Light) / `slate-900` (Dark). The fundamental canvas plane.
- **Tier 1 (Resting Cards & Containers):** Pure `#ffffff` (Light) / `slate-800` (Dark). Framed with a 1px border of `slate-200` (Light) or `slate-700` (Dark) without shadow drop.
- **Tier 2 (Interactive Floating Surfaces & Hover Cards):** Elevated with an ambient micro-shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.06)`. Border color remains standard.
- **Tier 3 (Floating Bars, Dialogs & Overlays):** Used for workout control sheets and active modal sheets: `0 12px 32px -4px rgba(15, 23, 42, 0.12)`.
- **Active / Focused States:** Accentuated with an outer stroke ring: `2px solid #4f46e5` offset by `2px` white space in light mode or `slate-900` in dark mode.

## Shapes

The design system adopts **Roundedness 2** (base `0.5rem` / `8px`), balancing professional discipline with approachable, friendly software ergonomics.

### Implementation Guidelines
- **Input Fields, Checkboxes & Micro-Chips:** Default to `0.5rem` (8px) radius to maintain structured rectangularity.
- **Exercise Cards & Group Panels:** Use `rounded-lg` (`1rem` / `16px`) to group multiple sets and metrics into distinct, digestible modules.
- **Modal Drawers & Bottom Sheets:** Employ `rounded-xl` (`1.5rem` / `24px`) on upper corners to soften sheet transitions.
- **Badges, Counter Pills & Status Chips:** Full pill radius (`9999px`) to distinguish categorical tags from interactive, rectangular action buttons.

## Components

### Buttons & Touch Targets
- **Dimensions:** Primary and secondary actions feature a minimum height of 48px (ideal 52px on mobile workout views) and horizontal padding of `space-lg`.
- **Primary:** Background `indigo-600` (`#4f46e5`), text white, font `label-lg`. Active state triggers `indigo-700`.
- **WhatsApp Action:** Background `emerald-600` (`#16a34a`), text white, high contrast icon lockup. Used exclusively to dispatch routines, workout completions, and motivational check-ins.
- **Secondary / Ghost:** 1px border `slate-300`, background transparent, text `slate-700` (Light) or `slate-200` (Dark).

### Cards (Exercise & Student Profiles)
- Built on Tier 1 elevation (`rounded-lg`, 1px border `slate-200`).
- **Student Profile Card:** Displays avatar, activity badge, weekly frequency indicator, and prominent amber callout banner if medical restrictions exist.
- **Workout Execution Card:** Header contains exercise name (`headline-md`), muscle group chip, and media reference button. Body exposes a structured table with 48px tall set/rep input cells. Set completion triggers an emerald stroke and a checkmark state.

### Chips & Filter Pills
- Interactive chips for selecting routine groups (e.g., "Treino A", "Membros Superiores", "Aquecimento") stand at 40px minimum height.
- Inactive state: `slate-100` background, `slate-600` text.
- Active state: `indigo-50` background, `indigo-600` text, 1.5px solid `indigo-600` border.

### Badges & Alerts (Clinical & State)
- **Injury / Anamnese Alert Badge:** Background `amber-50`, text `amber-800`, border 1px solid `amber-300`. Accompanied by a warning icon.
- **Completion Badges:** Background `emerald-50`, text `emerald-700`, border 1px solid `emerald-300`.

### Stepper & Routine Workflow
- Displays progression across complex workouts and multi-step builder forms.
- Step nodes are 32px circles containing numerical or icon indicators: completed nodes fill with `emerald-600`, active step with `indigo-600` (with outer halo), and upcoming steps resolve to muted `slate-200` surfaces. Connecting tracks span 2px solid lines.

### Inputs & Number Steppers
- Text and numeric inputs maintain a 48px height with `body-lg` font size (16px minimum to prevent auto-zoom in mobile Safari).
- Routine inputs provide integrated `+` and `-` steppers (48x48px tap areas) on both sides of numerical weights/reps, eliminating manual keyboard toggles while holding gym equipment.

### Tabs
- Segmented pill container (`slate-100` in light mode, `slate-800` in dark mode).
- Active tab uses an elevated white pill with micro-shadow, bold typography, and direct icon correlation.
