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

1. **Routing**: Use file-based routing in `app/routes/`. Export `loader` for data fetching and `action` for mutations.

2. **Database Operations**: Use Drizzle ORM for all database operations. Access D1 database through the Cloudflare Workers context.

3. **Component Development**: Follow existing patterns in `app/components/`. Use shadcn/ui components from `app/components/ui/` when possible.

4. **Type Safety**: TypeScript strict mode is enabled. Always provide proper types and avoid `any`.

5. **Styling**: Use TailwindCSS classes. Custom styles should follow the existing theme variables in `app/globals.css`.

6. **Forms**: Use react-hook-form with zod schemas for validation. Examples can be found in existing route modules.

## Testing

Currently, no testing framework is configured. When adding tests, consider Vitest for compatibility with Vite.
