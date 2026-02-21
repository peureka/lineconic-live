# Operator Right Panel — Compact Layout

**Date:** 2025-02-21
**Status:** Approved
**Approach:** A — Compact Everything

## Problem

The operator right panel (280px wide, full viewport height) overflows at shorter viewport heights (laptops at 650–720px). Content totals ~800px, requiring scrolling on anything below 800px.

## Strategy

Height-responsive: keep current generous sizes as the default, add a `@media(max-height:800px)` breakpoint that applies compact values. No behavior changes, no collapsing, no layout restructuring. Full breathing room on tall screens, compact on laptops.

## Implementation

All changes go inside a single new media query block:

```css
@media(max-height:800px){ /* compact overrides here */ }
```

Default styles remain untouched.

## Changes (applied inside the height breakpoint)

### 1. Panel Container & Gaps

| Property | Current | New | Savings |
|----------|---------|-----|---------|
| `.operator-right` gap | `--space-03` (16px) | `--space-02` (8px) | 56px (7 gaps) |
| `.operator-right` padding | `--space-03` (16px) | `--space-02` (8px) | 16px |
| **Subtotal** | | | **~72px** |

### 2. Scoreboard

| Property | Current | New | Savings |
|----------|---------|-----|---------|
| `.score-team` padding | `--space-03` (16px) | `--space-02` (8px) | ~16px |
| `.score-value` font-size | `--type-title` (2rem) | `1.25rem` | ~12px |
| `.score-value` min-height | `2.5rem` (40px) | remove | ~12px |
| `.score-btn` size | 44×44px | 32×32px | ~12px |
| `.score-btn` font-size | 18px | 14px | — |
| `.score-buttons` margin-top | `--space-02` (8px) | `--space-01` (4px) | ~4px |
| `.score-label` margin-bottom | `--space-02` (8px) | `--space-01` (4px) | ~4px |
| **Subtotal** | | | **~50px** |

### 3. Timer

| Property | Current | New | Savings |
|----------|---------|-----|---------|
| `.timer-display` padding | `--space-03` (16px) | `--space-02` (8px) | ~16px |
| `.timer-label` margin-bottom | `--space-02` (8px) | `--space-01` (4px) | ~4px |
| `.timer-bar-track` margin-bottom | `--space-02` (8px) | `--space-01` (4px) | ~4px |
| `.timer-buttons` margin-top | `--space-02` (8px) | `--space-01` (4px) | ~8px (2 rows) |
| `.timer-btn` height | 36px | 28px | ~8px |
| **Subtotal** | | | **~40px** |

### 4. Quick Access Row Gaps

| Property | Current | New | Savings |
|----------|---------|-----|---------|
| `.quick-btn-row` gap | `--space-02` (8px) | `--space-01` (4px) | ~8px |
| **Subtotal** | | | **~8px** |

## Total Savings: ~170px

Content height drops from ~800px to ~630px. Fits comfortably at 650px viewport with ~20px breathing room.

## Scope

- Desktop operator view only (the 3-column grid layout)
- Mobile operator already uses a different layout (`mob-*` classes at ≤768px)
- No changes to component behavior, just CSS sizing
