---
aliases: [commit-guide]
description: Commit message standards for the FinanSaku backend team.
lastUpdated: 2025-10-12
maintainer: FinanSaku Backend Team
---
# Commit Message Guide

This document defines the commit message standards for the **FinanSaku backend**
project.

It follows the **Conventional Commits** specification to ensure a clear and
consistent project history.

---

## 1. Format

Each commit message must follow this format:

```bash
<type>: <short summary>
````

Example:

```bash
feat: add login endpoint for auth module
```

---

## 2. Allowed Types

| Type         | Description                                           |
| ------------ | ----------------------------------------------------- |
| **feat**     | Adds a new feature or module                          |
| **fix**      | Fixes a bug or error                                  |
| **chore**    | Updates configuration, dependencies, or setup files   |
| **docs**     | Updates documentation files such as `.md` or `README` |
| **refactor** | Improves code structure without changing behavior     |
| **style**    | Applies formatting or code style changes              |
| **test**     | Adds or updates tests                                 |
| **build**    | Updates build tools or package dependencies           |

---

## 3. Examples

```bash
feat: add user registration endpoint
fix: correct JWT expiration validation
chore: update .env.example and nodemon.json
docs: add backend setup guide
refactor: simplify prisma service injection
```

---

## 4. Best Practices

- Use **imperative mood** (“add”, not “added”).
- Keep messages **under 72 characters** for readability.
- Group related changes into a single commit.
- Use **squash merge** to combine multiple small commits into one clean message.
- Avoid ambiguous or vague summaries (e.g., “update stuff”, “fix things”).

---

## 5. Commit Workflow Example

```bash
git add .
git commit -m "feat: implement UMK CRUD endpoints"
git push origin feat/umk-crud
```

To commit multiple documentation updates at once:

```bash
git add docs/commit-guide.md docs/backend-setup.md
git commit -m "docs: update commit and setup documentation"
git push origin dev
```

---

## 6. Notes

- All commits to `main` or `dev` must go through pull requests.
- Keep commit history focused and descriptive.
- Follow this guide before every PR submission.
