# Component Rules

This document outlines the engineering guidelines and quality standards for all React components in Aura Attendance.

## Rules for Component Creation

Every component must follow these guidelines:

1. **One Responsibility:** A component must focus on doing one thing well. If it performs multiple duties, split it.
2. **Reusable Design:** Avoid hardcoding local content or styles. Use props and tailwind class inputs.
3. **Loading State:** Must provide a loading skeleton or indicator when resolving async operations.
4. **Error State:** Must catch and handle rendering/fetch errors gracefully with friendly messages.
5. **Dark Mode Compatible:** Styling must support dark mode transitions using Tailwind `dark:` variants or tokens.
6. **Keyboard Accessible:** Interactive elements must be navigable via Tab, Enter, and Space keys. Ensure appropriate `aria-` labels.
7. **Accept `className`:** Always merge custom `className` properties using the `cn()` utility to allow parent layout adjustments.
8. **Use `forwardRef`:** Implement React `forwardRef` when building atomic UI elements to support focus management and DOM operations.
9. **Fully Typed:** All props and variables must be explicitly typed using TypeScript interfaces. Avoid using `any`.
10. **Maximum 250 Lines:** Component files must not exceed 250 lines of code. If a component exceeds this threshold, modularize its children into sub-components.
