# Performance Budget

This document defines the strict performance targets and constraints for Aura Attendance V1.

## 1. Performance Targets

All pages and API endpoints must conform to these latency and bundle size budgets:

| Item | Target | Description |
| :--- | :--- | :--- |
| **First Load JS** | `< 180 KB` | Total initial JavaScript payload sent to client |
| **Time to Interactive** | `< 2 s` | Time before the page is fully interactive |
| **Attendance Page** | `< 1 s` | Loader check-in/checkout page initial paint |
| **Dashboard** | `< 1.5 s` | Admin workspace loading duration |
| **API Response** | `< 300 ms` | Core server response latency (except biometrics matching) |
| **Face Match** | `< 2 s` | Server-side cosine similarity check & verify |
| **Attendance Punch** | `< 5 s` | End-to-end punch cycle (camera read, GPS, server punch) |

---

## 2. Engineering Guidelines

To maintain these targets, developers and AI agents must follow these rules:

- **No Heavy Libraries:** Do not add large chart libraries, moment.js, or heavy icon files.
- **Library Selection:**
  - Prefer native APIs (e.g. `Intl.DateTimeFormat`) or lightweight tools (e.g. `date-fns`) over large time engines.
  - Render simple SVG graphs directly instead of importing heavy plotting engines.
- **Lazy Loading:** Dynamically load heavy client modules (such as face-api webcam detectors) only when they are needed.
- **Server Components:** Keep components as React Server Components (RSC) by default to avoid sending component boilerplate code to the browser.
