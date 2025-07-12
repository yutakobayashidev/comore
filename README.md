# Comore

A modern, production-ready React Router v7 application with server-side rendering deployed on Cloudflare Workers.

## Tech Stack

- **Frontend**: React 19 with React Router v7 (SSR)
- **Backend**: Cloudflare Workers (serverless edge runtime)
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Styling**: TailwindCSS v4 with shadcn/ui components
- **Build Tool**: Vite with Cloudflare and React Router plugins
- **Package Manager**: pnpm
- **Testing**: Vitest with React Testing Library
- **Infrastructure**: Terraform for IaC

## Features

- 🚀 Server-side rendering with React Router v7
- ⚡️ Edge deployment on Cloudflare Workers
- 📦 D1 database with Drizzle ORM for data persistence
- 🎨 Modern UI with shadcn/ui components
- 🔒 TypeScript with strict mode
- 🧪 Comprehensive testing setup
- 🔧 Pre-commit hooks with linting and formatting
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account (for deployment)

### Installation

Install the dependencies:

```bash
pnpm install
```

### Development

Start the development server with HMR:

```bash
pnpm dev
```

Your application will be available at `http://localhost:5173`.

### Database Setup

Generate and apply database migrations:

```bash
# Generate migrations from schema changes
pnpm db:generate

# Apply migrations to local D1 database
pnpm db:migrate

# Open Drizzle Studio to inspect database
pnpm db:studio
```

## Available Commands

### Development

- `pnpm dev` - Start development server with HMR
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally
- `pnpm start` - Start production server locally

### Database Management

- `pnpm db:generate` - Generate Drizzle migrations from schema changes
- `pnpm db:migrate` - Apply migrations to local D1 database
- `pnpm db:migrate-production` - Apply migrations to production D1 database
- `pnpm db:studio` - Open Drizzle Studio for local database
- `pnpm db:studio:prod` - Open Drizzle Studio for production database

### Code Quality

- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run all linters (OxLint, ESLint, and Knip)
- `pnpm fmt` - Format code with Prettier

### Testing

- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage reporting

## Project Structure

```
├── app/                    # Main application code
│   ├── routes/            # React Router routes (file-based routing)
│   ├── components/ui/     # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities and configurations
├── database/              # Drizzle schema definitions
├── drizzle/              # Database migrations
├── tests/                # Test setup and configuration
├── workers/              # Cloudflare Workers specific code
└── terraform/            # Infrastructure as Code
```

## Deployment

### Cloudflare Workers

Deploy to Cloudflare Workers:

```bash
pnpm deploy
```

Before deploying, ensure you have:

1. Configured your Cloudflare account credentials
2. Set up your D1 database in Cloudflare
3. Updated `wrangler.jsonc` with your database bindings

### Production Database

Apply migrations to production:

```bash
pnpm db:migrate-production
```

## Development Guidelines

1. **Routing**: Use file-based routing in `app/routes/`. Export `loader` for data fetching and `action` for mutations.

2. **Database**: Use Drizzle ORM for all database operations. Schema is defined in `database/schema.ts`.

3. **Components**: Use shadcn/ui components from `app/components/ui/` when possible.

4. **Type Safety**: TypeScript strict mode is enabled. Always provide proper types.

5. **Testing**: Write tests alongside source files with `.test.{ts,tsx}` extension.

## UI Components

This project uses shadcn/ui with:

- "new-york" style configuration
- Dark mode support via next-themes
- Form handling with react-hook-form and zod validation
- Extensive component library including charts, dialogs, forms, etc.

## Contributing

1. Pre-commit hooks automatically run linting, formatting, and secret scanning
2. Ensure all tests pass before submitting PR
3. Follow existing code conventions and patterns
4. Update tests for any new functionality

---

Built with ❤️ using React Router and Cloudflare Workers.
