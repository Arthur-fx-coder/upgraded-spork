# Contributing Guide

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Getting Started

1. **Install pnpm** (if not already installed):

   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

   This will also set up git hooks automatically.

3. **Start development servers**:

   ```bash
   # Start all services
   pnpm dev

   # Or start individually
   pnpm dev:workers  # Cloudflare Worker (http://localhost:8787)
   pnpm dev:web      # Vite frontend (http://localhost:3000)
   ```

## Project Structure

```
monorepo/
├── .github/workflows/     # GitHub Actions CI/CD
│   └── ci.yml
├── .husky/                # Git hooks
│   ├── pre-commit         # Runs lint-staged
│   └── pre-push           # Runs typecheck + tests
├── workers/               # Cloudflare Worker package
│   ├── src/
│   │   ├── index.ts       # Worker entry point
│   │   └── index.test.ts  # Tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── wrangler.toml      # Cloudflare configuration
│   └── vitest.config.ts
├── web/                   # Vite + React frontend package
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   ├── App.test.tsx   # Tests
│   │   ├── main.tsx       # React entry point
│   │   └── index.css      # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .eslintrc.json         # Shared ESLint config
├── .prettierrc            # Shared Prettier config
├── .lintstagedrc.json     # Lint-staged config
├── tsconfig.json          # Base TypeScript config
├── pnpm-workspace.yaml    # pnpm workspace config
└── package.json           # Root package with scripts
```

## Available Scripts

### Root Level Commands

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `pnpm dev`           | Start all development servers in parallel    |
| `pnpm dev:workers`   | Start only the Cloudflare Worker dev server  |
| `pnpm dev:web`       | Start only the Vite frontend dev server      |
| `pnpm build`         | Build all packages                           |
| `pnpm build:workers` | Build only the workers package               |
| `pnpm build:web`     | Build only the web package                   |
| `pnpm lint`          | Lint all packages                            |
| `pnpm lint:fix`      | Lint and auto-fix issues in all packages     |
| `pnpm format`        | Format all files with Prettier               |
| `pnpm format:check`  | Check formatting without making changes      |
| `pnpm typecheck`     | Run TypeScript type checking on all packages |
| `pnpm test`          | Run tests for all packages                   |

### Package-Specific Commands

Navigate to the package directory (`cd workers` or `cd web`) and run:

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `pnpm dev`       | Start development server     |
| `pnpm build`     | Build the package            |
| `pnpm test`      | Run tests                    |
| `pnpm typecheck` | Run TypeScript type checking |

## Development Workflow

1. **Create a new branch** for your feature or bugfix

2. **Make your changes** following the project conventions

3. **Run tests and checks** before committing:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

4. **Commit your changes**. The pre-commit hook will automatically:
   - Run ESLint and fix issues
   - Format code with Prettier
   - Only on staged files (via lint-staged)

5. **Push your changes**. The pre-push hook will:
   - Run type checking
   - Run tests

6. **Create a pull request**. The CI workflow will automatically:
   - Run linting
   - Check formatting
   - Run type checking
   - Run tests
   - Build all packages

## Code Style

This project uses:

- **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** for type checking

Code style is enforced automatically:

- Single quotes
- Semicolons required
- 2-space indentation
- 80 character line width
- ES5 trailing commas
- LF line endings

## Git Hooks

Git hooks are automatically set up when you run `pnpm install`.

### Pre-commit

Runs `lint-staged` which:

- Lints and fixes TypeScript/JavaScript files
- Formats all staged files

### Pre-push

Runs:

- `pnpm typecheck` - Ensures no type errors
- `pnpm test` - Ensures all tests pass

## CI/CD

The project uses GitHub Actions for continuous integration. On every push and pull request, the CI workflow:

1. Installs dependencies
2. Runs linting
3. Checks code formatting
4. Runs type checking
5. Runs tests
6. Builds all packages

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for details.

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm --filter workers test:watch
pnpm --filter web test:watch
```

### Writing Tests

- Place test files next to the source files with `.test.ts` or `.test.tsx` extension
- Use Vitest for testing
- Workers package uses Node environment
- Web package uses jsdom environment

## TypeScript

### Configuration

- Base config: `tsconfig.json`
- Workers config: `workers/tsconfig.json` (extends base)
- Web config: `web/tsconfig.json` (extends base)

### Type Checking

```bash
# Check all packages
pnpm typecheck

# Check specific package
pnpm --filter workers typecheck
pnpm --filter web typecheck
```

## Cloudflare Workers

### Development

```bash
pnpm dev:workers
```

The worker will be available at http://localhost:8787

### Configuration

Edit `workers/wrangler.toml` to configure:

- Worker name
- Compatibility date
- KV namespaces
- Durable Objects
- Environment variables

### Deployment

```bash
cd workers
pnpm deploy
```

## Vite Frontend

### Development

```bash
pnpm dev:web
```

The frontend will be available at http://localhost:3000

### Configuration

Edit `web/vite.config.ts` to configure:

- Build settings
- Dev server options
- Plugins

### Building

```bash
pnpm build:web
```

Output will be in `web/dist/`

## Troubleshooting

### pnpm not found

Install pnpm globally:

```bash
npm install -g pnpm
```

### Git hooks not working

Reinstall git hooks:

```bash
pnpm exec husky install
```

### Type errors in editor

Ensure your editor is using the workspace TypeScript version:

- VS Code: Select "Use Workspace Version" for TypeScript
- Other editors: Configure to use `./node_modules/typescript`

### Module resolution issues

Clear cache and reinstall:

```bash
rm -rf node_modules
rm -rf web/node_modules
rm -rf workers/node_modules
rm pnpm-lock.yaml
pnpm install
```
