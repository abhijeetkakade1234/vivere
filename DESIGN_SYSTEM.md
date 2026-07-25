# Design System

This file defines the current frontend design direction.

## Experience Goals

The UI should feel:

- calm
- premium
- guided
- human

It should not feel:

- dashboard-heavy
- generic startup SaaS
- chatbot-first
- over-animated

## Current Brand Direction

The current shell uses a warm editorial palette rather than neon or cold enterprise colors.

### Color Tokens

Based on `styles/tokens.css` and the current homepage:

- `--ink-strong`: `#2f2723`
- `--ink-soft`: `#655750`
- `--accent-strong`: `#b14327`
- page background: warm cream and radial accent gradient

## Typography

Current choices:

- display: `Georgia, "Times New Roman", serif`
- body: `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif`

This is intentionally simple for the starter build. If custom brand fonts are introduced later, they should preserve the same warm, editorial feel.

## Layout Principles

- large headline first
- limited width for reading comfort
- one primary action per section
- cards should feel roomy, not compressed
- spacing should communicate calm more than density

## Component Direction

### Buttons

- rounded pill actions
- one strong primary
- one quiet secondary

### Cards

- soft corners
- light border
- subtle lift through shadow
- minimal content density

### Copy Blocks

- short sections
- plain language
- rationale over marketing fluff

## Motion

Current build uses only small hover transitions.

Future motion should:

- clarify progression
- help reveal hierarchy
- avoid constant ambient animation

## Accessibility Baseline

- readable contrast
- visible action states
- mobile-first spacing
- semantic headings and section labels
