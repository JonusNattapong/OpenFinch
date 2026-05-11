# Contributing to OpenFinch

Thank you for your interest in contributing! OpenFinch is an open-source, self-hosted AI web agent infrastructure.

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates.
2. Use the bug report template.
3. Include:
   - Environment details (OS, Docker version, Node version)
   - `openfinch doctor` output
   - Steps to reproduce
   - Expected vs actual behavior

### Feature Requests

1. Check existing issues and roadmap.
2. Use the feature request template.
3. Explain the use case and proposed solution.

### Pull Requests

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes.
4. Run tests: `pnpm test`
5. Run build: `pnpm build`
6. Submit a PR with a clear description.

## Development Setup

```bash
# Clone
git clone https://github.com/JonusNattapong/openfinch.git
cd openfinch

# Install
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run API in dev mode
pnpm dev
```

## Code Style

- TypeScript with strict mode
- ESM modules (import/export)
- Hono for API routes
- Zod for validation
- Vitest for tests
- Follow existing patterns in the codebase

## Project Structure

```
openfinch/
├── apps/api/          # REST API
├── packages/          # Shared packages
├── services/          # Worker services
├── infra/             # Docker configs
└── docs/              # Documentation
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
