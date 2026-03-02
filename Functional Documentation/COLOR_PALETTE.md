# Stepiva Color Palette

Single source of truth for all colors used in the product. Do not introduce colors outside this palette.

---

## Primary — Copper

The main brand color. Used for primary CTA buttons, active states, key highlights.

| Token | Hex | Usage |
|---|---|---|
| `primary-50` | `#FDF0E7` | Card backgrounds, selected tints |
| `primary-100` | `#FAE0CE` | Hover backgrounds |
| `primary-200` | `#F0C4A0` | Borders on hover |
| `primary-300` | `#D9996A` | Subtle accents |
| `primary-400` | `#C27A3E` | Medium accents, borders |
| **`primary-500`** | **`#9C4B20`** | **Primary buttons, active borders, icons** |
| `primary-600` | `#7D3C19` | Button hover states |
| `primary-700` | `#632F14` | Pressed states |
| `primary-800` | `#4A2310` | Deep accents |
| `primary-900` | `#35190B` | Dark text variants |

---

## Secondary — Sage

Used for secondary CTAs, success states, "strength" highlights.

| Token | Hex | Usage |
|---|---|---|
| `secondary-50` | `#EEF5EF` | Card backgrounds |
| `secondary-100` | `#DCEADE` | Hover backgrounds |
| `secondary-200` | `#B8D5BC` | Borders |
| `secondary-300` | `#8FBC96` | Subtle accents |
| `secondary-400` | `#6BA273` | Medium accents |
| **`secondary-500`** | **`#3D7A4A`** | **Secondary buttons, success, strength icons** |
| `secondary-600` | `#32653D` | Hover states |
| `secondary-700` | `#274F30` | Pressed states |
| `secondary-800` | `#1D3A24` | Deep accents |
| `secondary-900` | `#132618` | Dark text variants |

---

## Accent — Warm Gold

Used for warnings, milestone highlights, "in progress" badges.

| Token | Hex | Usage |
|---|---|---|
| `accent-50` | `#FDF6E7` | Card backgrounds |
| `accent-100` | `#FAEDCF` | Hover backgrounds |
| `accent-200` | `#F3D89A` | Borders |
| `accent-300` | `#E6BF65` | Subtle accents |
| `accent-400` | `#D4A843` | Medium accents |
| **`accent-500`** | **`#C68B2C`** | **Gold highlights, warnings, "in progress"** |
| `accent-600` | `#A07023` | Hover states |
| `accent-700` | `#7A561B` | Pressed states |

---

## Error — Warm Red

Used for blind spot alerts, errors, destructive actions.

| Token | Hex | Usage |
|---|---|---|
| `error-50` | `#FDF0EE` | Error backgrounds |
| `error-100` | `#F8D8D5` | Error borders |
| `error-300` | `#D06B62` | Error icons |
| **`error-500`** | **`#B84A42`** | **Error text, blind spot alerts** |
| `error-700` | `#7F312B` | Dark error accents |

---

## Info — Muted Blue

Used for informational states only. Not for primary UI.

| Token | Hex | Usage |
|---|---|---|
| `info-50` | `#EEF2F7` | Info backgrounds |
| `info-100` | `#D8E4EF` | Info borders |
| `info-400` | `#6B90B0` | Info icons |
| **`info-500`** | **`#4A7194`** | **Info text, secondary notes** |
| `info-700` | `#2F4A65` | Dark info accents |

---

## Neutrals — Warm Stone

Used for text, backgrounds, borders, dividers.

| Token | Hex | Usage |
|---|---|---|
| `neutral-0` | `#FFFFFF` | Pure white |
| `neutral-50` | `#FAF9F7` | Page backgrounds |
| `neutral-100` | `#F5F3F0` | Card backgrounds, inputs |
| `neutral-200` | `#E8E4DF` | Borders, dividers |
| `neutral-300` | `#D5CFC8` | Subtle borders |
| `neutral-400` | `#9C9690` | Placeholder text |
| `neutral-500` | `#6B6560` | Secondary text |
| `neutral-600` | `#57524D` | Medium text |
| `neutral-700` | `#44403C` | Body text |
| `neutral-800` | `#302C28` | Strong text |
| `neutral-900` | `#1A1714` | Headings, primary text |

---

## Semantic Usage Guide

| Context | Color |
|---|---|
| Primary CTA button | `#9C4B20` (copper-500), hover `#7D3C19` |
| Secondary CTA button | `#3D7A4A` (sage-500), hover `#274F30` |
| Selected / active card border | `#9C4B20` |
| Selected / active card background | `#FDF0E7` |
| Summary / highlight card | Gradient `#9C4B20 → #7D3C19` |
| In-progress badge | `#C68B2C` text on `#FDF6E7` bg |
| Blind spot alert | `#B84A42` |
| Leverage strength | `#3D7A4A` |
| Page background | `#FAF9F7` |
| Card background | `#FFFFFF` or `#F5F3F0` |
| Primary text | `#1A1714` |
| Secondary text | `#6B6560` |
| Borders | `#E8E4DF` or `#D5CFC8` |

---

## Colors NOT Used in Content Pages

These colors are **legacy** and exist only in admin/analytics utilities. Do not use them for any user-facing content, onboarding, or personality features:

- `#6366f1` (indigo) — legacy, header CSS variables only
- `#10b981` (emerald) — legacy
- `#7c3aed`, `#8b5cf6` (purple shades) — notification center only
- Any Tailwind gray (`#6b7280`, `#9ca3af`, etc.) outside admin pages

---

## Level Indicator (Special Case)

The level badge uses a hardcoded purple gradient that is intentionally distinct from the warm palette. Do not change it:

```
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```
