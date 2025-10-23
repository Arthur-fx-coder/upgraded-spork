# Monorepo

A monorepo containing a Cloudflare Worker backend and a Vite + React frontend.

## Structure

```
.
├── workers/         # Cloudflare Worker application
├── web/             # Vite + React frontend
└── package.json     # Root package with shared scripts
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Start development servers for both applications:

```bash
pnpm dev
```

This will start:

- Worker at http://localhost:8787
- Web frontend at http://localhost:3000

## Available Scripts

### Root Level

- `pnpm dev` - Start all development servers in parallel
- `pnpm dev:workers` - Start only the workers dev server
- `pnpm dev:web` - Start only the web dev server
- `pnpm build` - Build all packages
- `pnpm build:workers` - Build only the workers package
- `pnpm build:web` - Build only the web package
- `pnpm lint` - Lint all packages
- `pnpm lint:fix` - Lint and fix all packages
- `pnpm format` - Format all files with Prettier
- `pnpm format:check` - Check formatting without making changes
- `pnpm typecheck` - Run TypeScript type checking on all packages
- `pnpm test` - Run tests for all packages

### Individual Packages

Each package has its own README with specific instructions:

- [Workers README](./workers/README.md)
- [Web README](./web/README.md)

## Code Quality

This project uses:

- **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** for type checking
- **Husky** for git hooks
- **lint-staged** for running checks on staged files

Git hooks are automatically set up when you run `pnpm install`.

## CI/CD

GitHub Actions workflow is configured to run on push and pull requests:

- Linting
- Format checking
- Type checking
- Tests
- Build

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for details.

## Development

### Workers

The `workers` package contains a Cloudflare Worker application. See the [workers README](./workers/README.md) for more details.

### Web

The `web` package contains a Vite + React frontend application. See the [web README](./web/README.md) for more details.

## License

MIT
