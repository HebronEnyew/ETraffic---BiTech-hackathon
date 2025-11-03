# Contributing to ETraffic

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```
3. Set up environment variables (see `.env.example`)
4. Run database migrations:
   ```bash
   npm run migrate
   ```
5. Seed the database:
   ```bash
   npm run seed
   ```
6. Start development servers:
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

## Code Style

- **TypeScript**: Use strict mode, type all variables
- **Naming**: camelCase for variables, PascalCase for components
- **Formatting**: Use Prettier (configured in project)
- **Linting**: Follow ESLint rules

## Security Guidelines

### PII Data (Ethiopian National ID)

- Mark as sensitive in database schema
- Use encryption at rest in production
- Never log National ID values
- Include in audit logs only as masked/hashed values

### GPS Validation

- Always validate reported location against actual GPS
- Store distance in meters for audit
- Ban users after 3 GPS mismatches
- Log all GPS validation failures

### Authentication

- Use JWT tokens with expiration
- Store tokens securely (httpOnly cookies preferred)
- Implement rate limiting on auth endpoints
- Log all failed login attempts

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend E2E Tests

```bash
cd frontend
npm run test:e2e
```

## Pull Request Process

1. Create feature branch from `main`
2. Implement feature with tests
3. Update documentation if needed
4. Ensure all tests pass
5. Submit PR with clear description

## Commit Messages

Use conventional commits:
- `feat: Add new feature`
- `fix: Fix bug`
- `docs: Update documentation`
- `test: Add tests`
- `refactor: Refactor code`
- `security: Security fix`

## Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] All tests pass
- [ ] No security vulnerabilities
- [ ] PII data handled securely
- [ ] GPS validation implemented
- [ ] Rate limiting in place
- [ ] Error handling comprehensive
- [ ] Documentation updated
- [ ] i18n translations included (if UI changes)

## Questions?

Contact the development team or open an issue on GitHub.

