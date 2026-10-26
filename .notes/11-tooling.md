# Tooling
- **Pre-commit:**
  - zero comments in the codebase
  - gitleaks (no secrets or `.env` files)
  - lint and format
- **CI (not pre-commit, too slow):**
  - tests with coverage (`bun test --coverage --coverage-reporter=lcov`), fed to SonarQube
  - SonarQube scan with a quality gate on coverage
  - the merge is blocked if the gate fails
