# Design System Specification (DESIGN.md)
## Style: BMW Corporate-Automotive Precision UI System
### Project: Student Portal Pro (Personal & Academic Management System)

---

### 1. Visual Identity & Design Philosophy

- **Design System Name:** BMW Measured Corporate-Automotive UI
- **Aesthetic Classification:** Precision-Engineered, Measured, Rectangular (0px Radius), High-Contrast Typography (700 Display vs 300 Light Body), Pure Color-Block Contrast.
- **Core Primary Action Color:** BMW Corporate Blue (`#1c69d4`)
- **Shapes:** All buttons, cards, inputs, and tabs are strictly **rectangular (`rounded: 0px`)**.
- **Anti-Slop Invariants:** Zero em-dashes (`—`), zero drop shadows, clean hairline dividers, single-line 64px header.

---

### 2. Design Tokens (Vanilla CSS Variables)

```css
:root {
  --primary: #1c69d4;
  --primary-active: #0653b6;
  --primary-disabled: #d6d6d6;
  --ink: #262626;
  --body: #3c3c3c;
  --body-strong: #1a1a1a;
  --muted: #6b6b6b;
  --muted-soft: #9a9a9a;
  --hairline: #e6e6e6;
  --hairline-strong: #cccccc;
  --canvas: #ffffff;
  --surface-soft: #f7f7f7;
  --surface-card: #fafafa;
  --surface-strong: #ebebeb;
  --surface-dark: #1a2129;
  --surface-dark-elevated: #262e38;
  --on-primary: #ffffff;
  --on-dark: #ffffff;
  --on-dark-soft: #bbbbbb;
  --m-blue-light: #0066b1;
  --m-blue-dark: #1c69d4;
  --m-red: #e22718;
}

.dark {
  --canvas: #1a2129;
  --surface-soft: #262e38;
  --surface-card: #1f2732;
  --surface-strong: #323d4a;
  --surface-dark: #10151b;
  --surface-dark-elevated: #1f2732;
  --ink: #ffffff;
  --body: #d6d6d6;
  --body-strong: #ffffff;
  --muted: #9a9a9a;
  --muted-soft: #6b6b6b;
  --hairline: #323d4a;
  --hairline-strong: #4a5666;
  --primary: #1c69d4;
  --primary-active: #2b7cf0;
  --on-primary: #ffffff;
  --on-dark: #ffffff;
  --on-dark-soft: #bbbbbb;
}
```

---

### 3. Typography Hierarchy

- **Font Family:** `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Display 700:** Heavy bold headlines (`font-bold`, `font-extrabold`).
- **Body 300:** Light clean copy (`font-light`).
- **Inline Action Links:** Uppercase with letter spacing (`text-[13px] font-bold tracking-[1.5px] uppercase`).
