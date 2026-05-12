# Money Finance Web App

A modern personal finance web app for tracking expenses, income, subscriptions, budgets, savings goals, and financial insights.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding_standards.md
- @context/project-spec.md

## Commands

- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Production server**: `npm run start`
- **Lint**: `npm run lint`

## Product Scope

The app focuses on helping users manage their personal finances through:

- transaction tracking
- budget management
- subscription tracking
- savings goals
- financial analytics and insights

## Core Rules

- Always keep the codebase clean, modular, and production-ready.
- Prefer the latest stable and widely used patterns.
- Do not create unnecessary abstractions.
- Keep UI consistent across all pages and components.
- Prioritize responsive design and accessibility.
- Follow the project context files before making changes.
- When implementing a feature, preserve existing architecture and naming conventions.
- Do not guess business logic if it is not defined in the context files.

## Expected Tech Direction

- **Frontend**: Next.js + TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend / Database / Auth**: Supabase
- **Charts**: Recharts

## Agent Workflow

Before making any change:

1. Read all context files.
2. Understand the current feature and project constraints.
3. Check existing patterns in the codebase.
4. Plan the implementation before editing.
5. Keep changes minimal, clean, and consistent.
6. Update related context files if the feature changes project behavior.

## Implementation Notes

- Prefer server-side and secure patterns where needed.
- Validate user input properly.
- Keep database interactions typed and predictable.
- Use reusable components for repeated UI patterns.
- Avoid hardcoding values that should live in config, constants, or schema definitions.
- Maintain clear separation between UI, business logic, and data access layers.
