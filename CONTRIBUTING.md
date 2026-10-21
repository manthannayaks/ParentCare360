# Contributing to ParentCare360

Thank you for your interest in contributing to **ParentCare360**! This document provides standards for branching, code style, testing, and pull requests.

---

## 1. Code of Conduct & Principles

- **Preserve Elderly Ergonomics:** Senior-citizen UI components must maintain large tap targets (minimum 44x44px), high color contrast, and plain-language labels.
- **Maintain Data Integrity:** Every data transformation must respect the 4-tier validation rules. Do not bypass the Dead Letter Queue for malformed inputs.
- **Strict Role Boundaries:** Do not introduce UI shortcuts that cross-contaminate authenticated roles. Caregivers must never receive unmasked PII.

---

## 2. Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/manthannayaks/ParentCare360.git
cd ParentCare360

# 2. Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Initialize database & seed profiles
python3 database/db.py
python3 database/seed_data.py

# 4. Set up frontend dependencies
cd frontend
npm install
cd ..
```

---

## 3. Running Verification Tests

Before submitting any pull request, ensure all tests pass:

```bash
# Run complete test suite
python3 -m pytest -v

# Run frontend build
cd frontend && npm run build && cd ..
```

---

## 4. Branching & Commit Conventions

- Use feature branches: `git checkout -b feat/your-feature-name` or `fix/issue-description`.
- Follow Conventional Commits:
  - `feat: add prescription reminder notification`
  - `fix: resolve cold-start network timeout in family connection`
  - `docs: update API reference for location sharing`
  - `refactor: optimize composite index on caregiver visits`

---

## 5. Submitting a Pull Request

1. Push your branch to GitHub.
2. Open a Pull Request against `main`.
3. Provide a clear description of the problem addressed, technical decisions made, and test evidence demonstrating 100% pass rates.
