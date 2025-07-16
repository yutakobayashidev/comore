# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Router v7 application with server-side rendering (SSR) deployed on Cloudflare Workers with D1 database. The project uses Vite as the build tool and pnpm as the package manager.

## Essential Commands

### Development

- `pnpm dev` - Start development server with HMR
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally
- `pnpm deploy` - Deploy to Cloudflare Workers
- `pnpm start` - Start production server locally

### Database Management

- `pnpm db:generate` - Generate Drizzle migrations from schema changes
- `pnpm db:migrate` - Apply migrations to local D1 database
- `pnpm db:migrate-production` - Apply migrations to production D1 database
- `pnpm db:studio` - Open Drizzle Studio for local database inspection
- `pnpm db:studio:prod` - Open Drizzle Studio for production database

### Code Quality

- `pnpm typecheck` - Run TypeScript type checking (generates route types first)
- `pnpm lint` - Run all linters (OxLint, ESLint, and Knip)
- `pnpm fmt` - Format code with Prettier

### Testing

- `pnpm test` - Run all tests with Vitest
- `pnpm test:watch` - Run tests in watch mode during development
- `pnpm test:coverage` - Run tests with coverage reporting

## Architecture Overview

### Stack

- **Frontend**: React 19 with React Router v7 for SSR
- **Backend**: Cloudflare Workers (serverless edge runtime)
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Styling**: TailwindCSS v4 with shadcn/ui components
- **Build Tool**: Vite with Cloudflare and React Router plugins

### Key Directories

- `app/` - Main application code
  - `routes/` - React Router route modules (file-based routing)
  - `components/ui/` - shadcn/ui components (pre-built, customizable)
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions and configurations
- `database/` - Drizzle schema definitions
- `drizzle/` - Database migrations
- `tests/` - Test setup and configuration files
- `workers/` - Cloudflare Workers specific code
- `terraform/` - Infrastructure as Code configuration

### Database Schema

The project uses Drizzle ORM with two main tables:

- `users` - User management
- `feeds` - Feed data

Schema is defined in `database/schema.ts`. Always generate migrations after schema changes.

### Development Workflow

1. Pre-commit hooks automatically run linting, formatting, and secret scanning on staged files
2. TypeScript strict mode is enabled - ensure all code is properly typed
3. Route types are auto-generated from route modules
4. Cloudflare Worker types are generated from wrangler.jsonc

### Important Configuration Files

- `react-router.config.ts` - SSR configuration and app entry points
- `vite.config.ts` - Build configuration with Cloudflare integration
- `vitest.config.ts` - Vitest testing framework configuration
- `wrangler.jsonc` - Cloudflare Workers deployment configuration
- `drizzle.config.ts` - Database ORM configuration
- `lefthook.yml` - Git hooks configuration

### UI Components

The project uses shadcn/ui components with:

- "new-york" style configuration
- Dark mode support via next-themes
- Form handling with react-hook-form and zod validation
- Extensive component library including charts, dialogs, forms, etc.

## Development Guidelines

1. **Routing**:
   - Create route modules in `app/routes/` directory
   - Export `loader` for data fetching and `action` for mutations
   - **IMPORTANT**: After creating a new route file, you must add it to `app/routes.ts` to register the route
   - Routes are explicitly defined in `app/routes.ts` using React Router v7's route configuration

2. **Database Operations**: Use Drizzle ORM for all database operations. Access D1 database through the Cloudflare Workers context.

3. **Component Development**: Follow existing patterns in `app/components/`. Use shadcn/ui components from `app/components/ui/` when possible.

4. **Type Safety**: TypeScript strict mode is enabled. Always provide proper types and avoid `any`.

5. **Styling**: Use TailwindCSS classes. Custom styles should follow the existing theme variables in `app/globals.css`.

6. **Forms**: Use react-hook-form with zod schemas for validation. Examples can be found in existing route modules.

7. **Testing**: Write tests for components and utilities using Vitest and React Testing Library. Place test files alongside source files with `.test.{ts,tsx}` extension.

8. **Currying Pattern for Database Functions**:
   - All database operation functions in `app/lib/` must follow a currying pattern
   - First parameter: database connection (`db: DrizzleD1Database<typeof schema>`)
   - Second parameter: actual function parameters
   - Pattern:
     ```typescript
     export const functionName = (db: DB) => async (params: ParamType) => {
       // implementation
     };
     ```
   - Usage in routes:
     ```typescript
     const result = await functionName(context.db)(params);
     ```
   - Pure functions that don't interact with the database should NOT be curried
   - This pattern enables dependency injection and makes testing easier

## Testing

The project uses Vitest as the testing framework with React Testing Library for component testing.

### Configuration

- **Framework**: Vitest with jsdom environment for DOM testing
- **Testing Library**: @testing-library/react for component testing
- **Matchers**: @testing-library/jest-dom for enhanced assertions
- **Coverage**: V8 coverage provider for code coverage reports

### Test Structure

- Test files should be placed alongside source files with `.test.{ts,tsx}` extension
- Global test setup is configured in `tests/vitest.global.setup.ts` (sets UTC timezone)
- Test utilities and jest-dom matchers are imported via `tests/vitest.setup.ts`
- Mock settings are configured to reset between tests for isolation

### Best Practices

1. **File Naming**: Use `.test.{ts,tsx}` suffix for test files
2. **Test Location**: Place tests alongside the code they test (e.g., `component.tsx` → `component.test.tsx`)
3. **Component Testing**: Use React Testing Library for testing React components
4. **Isolation**: Tests are configured to reset mocks and clear state between runs
5. **Environment**: Tests run in jsdom environment to simulate browser APIs

### Running Tests

- `pnpm test` - Run all tests once
- `pnpm test:watch` - Run tests in watch mode (re-runs on file changes)
- `pnpm test:coverage` - Generate and display code coverage report

## Human-in-the-Loop Integration

**IMPORTANT**: When you have questions or need clarification about project-specific decisions, always use the `mcp__human-in-the-loop__ask_human` tool to ask questions.

### When to Use

- When project-specific design decisions are needed
- When there are multiple implementation approaches and you're unsure which to choose
- When the intent of existing code is unclear
- Before making breaking changes or large-scale refactoring
- Before making changes that could affect production
- When business logic or user requirements need clarification

### Best Practices

- Ask specific questions with context
- Prefer questions that request detailed explanations over simple Yes/No questions
- Ask one question at a time unless multiple questions are closely related
- Include relevant context about what you're trying to achieve
