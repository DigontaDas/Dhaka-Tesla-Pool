---
name: Electric Rickshaw Transit
colors:
  surface: '#0f1419'
  surface-dim: '#0f1419'
  surface-bright: '#353a3f'
  surface-container-lowest: '#0a0f14'
  surface-container-low: '#171c21'
  surface-container: '#1b2025'
  surface-container-high: '#252a30'
  surface-container-highest: '#30353b'
  on-surface: '#dee3ea'
  on-surface-variant: '#bacac2'
  inverse-surface: '#dee3ea'
  inverse-on-surface: '#2c3136'
  outline: '#85948d'
  outline-variant: '#3b4a44'
  surface-tint: '#28dfb5'
  primary: '#46f1c5'
  on-primary: '#00382b'
  primary-container: '#00d4aa'
  on-primary-container: '#005643'
  inverse-primary: '#006b55'
  secondary: '#ffdb9d'
  on-secondary: '#412d00'
  secondary-container: '#feb700'
  on-secondary-container: '#6b4b00'
  tertiary: '#cfd8ec'
  on-tertiary: '#283140'
  tertiary-container: '#b3bcd0'
  on-tertiary-container: '#434c5c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#55fcd0'
  primary-fixed-dim: '#28dfb5'
  on-primary-fixed: '#002118'
  on-primary-fixed-variant: '#00513f'
  secondary-fixed: '#ffdea8'
  secondary-fixed-dim: '#ffba20'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4200'
  tertiary-fixed: '#dae3f7'
  tertiary-fixed-dim: '#bec7db'
  on-tertiary-fixed: '#131c2a'
  on-tertiary-fixed-variant: '#3e4758'
  background: '#0f1419'
  on-background: '#dee3ea'
  surface-variant: '#30353b'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  display-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-md:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
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
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Sora
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system powers a hyper-local, electric micro-mobility pooling platform engineered specifically for Dhaka’s high-density urban transit. The visual language bridges raw street-level energy with clean, next-generation electric mobility. It rejects sterile Silicon Valley corporate templates in favor of a nocturnal, neon-infused street aesthetic that feels fast, dependable, and intensely modern.

The design movement is **Cyber-Mobility Glassmorphism**: ultra-deep charcoal canvases cut with electric teal conduits, warm amber pricing signals, translucent layered glass sheets, and glowing navigational pill surfaces. The interface evokes velocity, nocturnal navigation under neon rain, battery-driven torque, and fluid urban density while preserving uncompromising clarity for commuters booking rides on the move in unpredictable conditions.

## Colors

The palette is tuned specifically for low-light legibility, battery conservation on OLED panels, and high daylight contrast when riding open-air vehicles:

- **Primary Canvas (`#0F1419`)**: Deep, carbon charcoal base that provides an infinite abyss for illuminated overlays and map layers.
- **Surface Elevation Cards (`#1A2332`)**: Dense slate-navy layer used for ride cards, floating route bottom-sheets, and interactive drawer modules.
- **Primary Kinetic Accent (`#00D4AA` - Electric Mint/Teal)**: Represents electric power, route confirmation, live GPS vehicle blips, and primary booking actions. Emits a subtle luminescent perimeter when interactive.
- **Secondary Accent (`#FFB800` - High-Voltage Amber)**: Reserved strictly for fare pricing, surge indications, pool savings counters, battery alerts, and urgency statuses.
- **Support Tones**:
  - **Surface Glass**: `rgba(26, 35, 50, 0.72)` with backdrop blur.
  - **Border / Subtle Divider**: `rgba(255, 255, 255, 0.08)` to preserve edge fidelity without harshness.
  - **Text High-Contrast**: `#F1F5F9` (Primary readable labels and headlines).
  - **Text Muted**: `#94A3B8` (Route metadata, secondary stop listings, vehicle plates).

## Typography

The typographic hierarchy pairs **Sora** for headlines, fares, and badges with **Inter** for dense transactional UI, pickup addresses, and live routing feeds.

- **Sora** conveys geometric velocity, electric agility, and technological intent. Its wide apertures and crisp numbers ensure that fare breakdowns (৳ BDT) and ETA counters stand out instantaneously on moving vehicles.
- **Inter** handles high-information tasks: landmark directions, driver notes, passenger count indicators, and terms with neutral clarity and compact horizontal footprints.
- Tabular figures must be enabled (`font-variant-numeric: tabular-nums`) across all timestamps, pricing tags, and distance metrics to eliminate visual jitter during real-time tracking updates.

## Layout & Spacing

The layout is built mobile-first, targeting standard smartphone screen widths (360px–430px) held single-handedly while navigating crowded stands:

- **Layout Grid**: 4-column fluid mobile grid with `1rem` (16px) margins and `1rem` gutters. Expands to a centered max-width rail (480px) on desktop viewports to simulate native app architecture.
- **Safe Zones & Reachability**: Critical call-to-actions, ride confirmations, and pool slot selectors are permanently anchored in the bottom 40% thumb-zone.
- **Rhythm**: Standard 4px/8px modular spacing cadence. Gaps between compact input rows utilize `space-sm` (8px), card interior padding uses `space-md` (16px), and screen-edge offset adheres strictly to `margin` (16px).

## Elevation & Depth

Visual hierarchy uses physical layer depth rather than heavy drop shadows, mimicking clean cockpit HUDs:

- **Base Layer (Level 0 - `#0F1419`)**: Canvas layer rendering map vector tiles styled in darkened monochrome with mint-tinted road arteries.
- **Surface Elevation (Level 1 - `#1A2332`)**: Solid card containers with a 1px perimeter border of `rgba(255, 255, 255, 0.06)` to provide separation without heavy ambient drop.
- **Floating Glass Shelves (Level 2)**: Modals, bottom-sheets, and floating pill selectors utilize `rgba(26, 35, 50, 0.78)` backed by `backdrop-filter: blur(16px)` and a directional top highlight border `rgba(255, 255, 255, 0.14)`.
- **Active Radiant Glow**: Critical interactive states (e.g., active hailing vehicle, ETA alert, live booking button) employ a colored rim glow: `0 0 20px rgba(0, 212, 170, 0.28)`.

## Shapes

The design system adopts a **Pill-Shaped (Level 3)** geometry. 

- Interactive badges, pool seat chips, trip status tags, and action triggers all terminate in complete pill radii (`rounded-full` / 9999px).
- Bottom sheets and structural card enclosures adopt `rounded-xl` (1.5rem / 24px) on their top or surrounding vertices, balancing aerodynamic speed with tactile, human comfort.
- Circular icons and circular avatar containers are used exclusively for drivers, battery indicators, and route start/end pins.

## Components

### Buttons
- **Primary CTA ("Confirm Pool", "Hail Tesla")**: High-visibility `#00D4AA` background, `#0F1419` text in Sora SemiBold (`label-lg`), pill-shaped. Height is 56px to ensure one-handed thumb-reach. Active state: subtle scale down (`0.98`) with a mint radial glow.
- **Secondary Action**: Translucent dark slate `rgba(26, 35, 50, 0.8)` with a 1px border of `#00D4AA`, text in `#00D4AA`.
- **Urgent / Surge CTA**: Solid `#FFB800` background, `#0F1419` text, used exclusively during high-demand or ride-splitting time windows.

### Chips & Badges
- **Seat Availability ("2 Seats Left")**: Pill containers with `rgba(0, 212, 170, 0.12)` fill, `#00D4AA` text, and `label-sm` font.
- **Fare Tags ("৳ 35 Share")**: `#FFB800` text enclosed in `rgba(255, 184, 0, 0.15)` pill with an amber dot indicator.
- **Vehicle Type ("Battery Tesla")**: Slate pill with mini lightning bolt glyph.

### Ride Cards
- Built using the `#1A2332` surface with backdrop glass treatment. Internal structure splits cleanly between pickup ETA, driver battery percentage badge, pool occupant counter, and fixed upfront fare in Sora Bold.
- Card borders feature a delicate gradient stroke transitioning from `rgba(255,255,255,0.12)` at the top edge to `rgba(255,255,255,0.02)` at the bottom.

### Inputs & Route Selectors
- **Address / Destination Bar**: Translucent `#1A2332` surface with 1px border. Focus state replaces the border with an `#00D4AA` edge and a faint teal inner-glow.
- Text uses `body-md` in `#F1F5F9` with placeholder text in `#94A3B8`. Left-hand accessories use circular route markers (Mint ring for pickup, Amber pin for destination).

### Checkboxes, Toggles & Seat Pickers
- **Seat Selection Matrix**: Horizontal pill toggle groups. Selected seats illuminate in solid `#00D4AA` with dark iconography; occupied seats remain muted slate `rgba(255,255,255,0.05)`.
- **Toggles**: Smooth pill track (`#1A2332`), sliding circular thumb shifting to `#00D4AA` when active.