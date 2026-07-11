# Performance Budget

This document defines the strict performance targets and constraints for Aura Attendance V1.

## 1. Performance Targets

All pages and API endpoints must conform to these latency budgets:

| Item | Target | Description |
| :--- | :--- | :--- |
| **First Load JS** | `< 180 KB` | Total initial JavaScript payload sent to client |
| **Login** | `< 1 sec` | Login request and session verification |
| **Overview (Dashboard)**| `< 1.5 sec` | Admin overview screen loading time |
| **Attendance Page** | `< 1 sec` | Kiosk scanner page loading time |
| **Face Detection** | `< 2 sec` | Browser-level facial boundary extraction |
| **Attendance Punch** | `< 5 sec` | End-to-end punch cycle (capture, geofence, server write) |
| **Employee Search** | `< 300 ms` | Search filter responsiveness on employees list |
| **Reports** | `< 2 sec` | Export data generation and spreadsheet download |

---

## 2. Engineering Guidelines

To maintain these targets, developers and AI agents must follow these rules:

- **No Heavy Libraries:** Do not add large chart libraries, moment.js, or heavy icon files.
- **Library Selection:**
  - Prefer native APIs (e.g. `Intl.DateTimeFormat`) or lightweight tools (e.g. `date-fns`) over large time engines.
  - Render simple SVG graphs directly instead of importing heavy plotting engines.
- **Lazy Loading:** Dynamically load heavy client modules (such as face-api webcam detectors) only when they are needed.
- **Server Components:** Keep components as React Server Components (RSC) by default to avoid sending component boilerplate code to the browser.
