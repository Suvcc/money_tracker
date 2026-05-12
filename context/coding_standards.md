# Coding Standards

This document defines the coding standards for the MoneyFinance project.

The goal is to keep the codebase clean, consistent, maintainable, and scalable while avoiding unnecessary complexity.

---

## 1. General Principles

- Use clear and descriptive names for variables, functions, components, and files.
- Prefer readability over cleverness.
- Write code that is easy to understand, review, and extend.
- Keep logic simple and predictable.
- Avoid overengineering.
- Build for long-term maintainability, not just short-term speed.
- Always prefer the cleanest and most widely used professional approach.

---

## 2. Language & Framework Rules

- Use **TypeScript** everywhere.
- Use **Next.js App Router** structure.
- Use **React functional components** only.
- Use **Tailwind CSS** for styling.
- Use **Supabase** for authentication and database access.
- Prefer **server components by default** in Next.js.
- Only use `"use client"` when interactivity is required.

---

## 3. Project Structure Rules

- Keep the project organized by feature and responsibility.
- Separate UI, business logic, database logic, and utility logic clearly.
- Do not mix unrelated concerns in the same file.
- Keep context documents inside `/context`.
- Keep SQL and database-related files inside `/database`.
- Keep reusable UI components inside a shared components folder.
- Keep feature-specific components close to their feature when appropriate.

---

## 4. Naming Conventions

### Files
- Use lowercase with hyphens for general file names when appropriate.
- Use PascalCase for React component files.
- Use clear names that reflect purpose.

### Variables
- Use camelCase.
- Names must describe the actual meaning of the data.
- Avoid vague names like `data`, `item`, `value`, `temp`, unless context is extremely clear.

### Functions
- Use verb-based names.
- Function names should describe exactly what they do.

Examples:
- `createTransaction`
- `parseReceiptText`
- `getMonthlySubscriptionTotal`

### Components
- Use PascalCase.
- Component names must describe UI purpose.

Examples:
- `TransactionForm`
- `SubscriptionCard`
- `ReceiptPreviewPanel`

---

## 5. TypeScript Rules

- Do not use `any` unless absolutely unavoidable.
- Prefer explicit types for important business data.
- Create proper shared types for core entities:
  - Profile
  - Category
  - Transaction
  - ReceiptImport
  - Subscription
  - SubscriptionBilling
- Use union types for known states instead of loose strings when possible.
- Prefer strict typing over implicit assumptions.
- Validate nullable fields carefully.

---

## 6. React Component Standards

- Keep components focused on one responsibility.
- Do not create very large components with too many concerns.
- Extract repeated UI into reusable components.
- Separate form UI from data submission logic when useful.
- Keep presentational components clean and simple.
- Avoid deeply nested JSX when it hurts readability.
- Prefer composition over duplication.

### Preferred Component Style
- Small, reusable, readable
- Clear props
- Minimal side effects
- Easy to test later

---

## 7. State Management Rules

- Use local state for simple UI interactions.
- Use server state tools for remote data.
- Do not introduce global state unless clearly needed.
- Prefer **TanStack Query** for fetching, caching, and syncing server data.
- Keep derived state computed instead of duplicated when possible.
- Avoid unnecessary state variables.

---

## 8. Data Fetching Rules

- Keep data fetching predictable and centralized.
- Use typed Supabase queries.
- Handle loading, empty, and error states explicitly.
- Do not fetch unnecessary data.
- Prefer server-side fetching where it makes sense.
- Use client-side fetching only for interactive or frequently updated UI.

---

## 9. Database & Supabase Rules

- Never trust client input.
- Always respect ownership boundaries using `user_id`.
- Rely on **RLS** and database constraints, not only frontend checks.
- Keep business-critical integrity enforced in the database whenever possible.
- Use soft delete where designed instead of hard delete.
- Do not bypass ownership validation logic.
- Do not write database logic in random UI files.

### Important Rule
For finance-related data:
- accuracy is more important than convenience
- constraints are preferred over assumptions

---

## 10. Forms & Validation Rules

- Validate user input clearly before submission.
- Show helpful validation messages.
- Keep forms minimal and focused.
- Do not silently accept invalid financial data.
- Numeric fields must always be validated carefully.
- Dates and amounts must be treated as important business data.
- Receipt parsing results must always be editable before confirmation.

---

## 11. Transaction Rules

- Transactions represent real confirmed financial events.
- Do not use transactions for future predicted events.
- A subscription itself is not a transaction.
- A subscription billing becomes a transaction only when paid.
- Receipt imports should not directly count as transactions until confirmed.

---

## 12. Subscription Rules

- Subscriptions represent recurring rules.
- Billing occurrences represent expected or completed charges.
- Keep subscription logic separate from transaction logic.
- Do not collapse subscriptions and transactions into one model.
- Always preserve the distinction between:
  - recurring rule
  - billing occurrence
  - actual paid transaction

---

## 13. Error Handling Rules

- Handle errors explicitly.
- Do not swallow errors silently.
- Show user-friendly messages in the UI.
- Log technical details when useful for debugging.
- Keep failure cases predictable.
- Build safe fallbacks for parsing and automation features.

Examples:
- receipt parsing failed
- billing generation conflict
- invalid category ownership
- failed transaction creation

---

## 14. UI & Styling Rules

- Keep the UI clean, minimal, and modern.
- Prioritize clarity over decoration.
- Maintain consistent spacing, sizing, and visual hierarchy.
- Use reusable UI patterns for cards, forms, lists, and filters.
- Keep interactions intuitive and lightweight.
- Avoid cluttered dashboards.
- Design for practical daily use.

### Design Priorities
- fast to scan
- easy to use
- low friction
- visually clean
- responsive

---

## 15. Accessibility & UX Rules

- Use semantic HTML where possible.
- Buttons and inputs must be clearly labeled.
- Forms should be keyboard-friendly.
- Error states should be understandable.
- Empty states should guide the user.
- Important financial actions should be clear and safe.

---

## 16. Reusability Rules

Before creating new code, check whether:
- the same pattern already exists
- the same logic can be extracted
- the same UI can be reused

Avoid:
- duplicated form logic
- duplicated filtering logic
- duplicated card layouts
- duplicated status badge logic

---

## 17. File Size & Complexity Rules

- Keep files reasonably sized.
- Split files when they become hard to understand.
- Avoid files that contain too many unrelated concerns.
- Large files are acceptable only when the structure remains clear.
- Prefer modular code over monolithic code.

---

## 18. Comments & Documentation

- Write comments only when they add real value.
- Do not explain obvious code.
- Use comments for:
  - business rules
  - tricky logic
  - important constraints
  - non-obvious decisions

Good comments explain **why**, not just **what**.

---

## 19. Testing Mindset

Even if tests are not added immediately, code should be written in a way that is testable later.

Prefer:
- pure utility functions
- isolated business logic
- predictable outputs
- small focused components

Especially for:
- receipt parsing
- billing generation logic
- financial calculations
- date logic
- dashboard summaries

---

## 20. Performance Guidelines

- Do not optimize prematurely.
- But avoid obvious inefficiencies.
- Memoize only when there is a real reason.
- Keep queries efficient.
- Use indexes properly in the database.
- Avoid unnecessary rerenders caused by poor component structure.

---

## 21. Security Rules

- Never expose secrets in frontend code.
- Keep sensitive logic on the server or protected through Supabase policies.
- Respect all ownership boundaries.
- Assume user input can be wrong or malicious.
- Do not rely on UI-only protection for important operations.

---

## 22. AI-Agent Development Rules

When using AI to generate or modify code:

- Follow the project structure exactly.
- Do not introduce unnecessary libraries.
- Do not rewrite unrelated parts of the codebase.
- Do not create duplicate logic if a reusable function/component already exists.
- Always preserve business rules around:
  - transactions
  - receipt imports
  - subscriptions
  - subscription billings
- Prefer incremental and safe changes.
- Keep code production-minded, not tutorial-style.

---

## 23. Preferred Engineering Style for This Project

The preferred style for this project is:

- modern
- clean
- strongly typed
- modular
- readable
- practical
- production-minded

This project should feel like a real product codebase, even though it is for personal use.

---

## 24. Final Standard

When making implementation decisions, prefer the option that is:

1. clearer
2. safer
3. easier to maintain
4. more professional
5. more aligned with modern best practices