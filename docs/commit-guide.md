# Commit Message Guide

This document defines the commit message standards for the **FinanSaku Backend**
project.
We follow the **Conventional Commits** convention to keep history clean and
readable.

---

## Format

```plaintext
<type>: <short summary>
```

**Example:**

```plaintext
feat: add login endpoint for auth module
```

---

## Allowed Types

| Type | Usage |
|------|--------|
| **feat:** | For new features or modules. |
| **fix:** | For bug fixes. |
| **chore:** | For setup or maintenance (configs, dependencies). |
| **docs:** | For documentation updates (README, markdown files). |
| **refactor:** | For code structure improvements (no behavior change). |
| **style:** | For formatting or code style changes. |
| **test:** | For unit or integration tests. |
| **build:** | For dependency or build tool updates. |

---

## Examples

```bash
feat: add user registration endpoint
fix: correct JWT expiration validation
chore: update .env.example and nodemon.json
docs: add backend setup guide
refactor: simplify prisma service injection
```

---

## Tips

- Use **imperative tone** (“add” not “added”).
- Keep the **summary under 72 characters**.
- Group related commits logically.
- Use **squash merge** to combine small commits into one clean message.

---

## Final Commands to Add, Commit, and Push

```bash
git add docs/commit-guide.md docs/backend-setup.md
git commit -m "docs: add commit guide and backend setup documentation"
git push origin dev
```
