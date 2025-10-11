# Collaboration & Merge Workflow

This document defines how Backend A and Backend B collaborate within the
FinanSaku backend repository.

---

## Branch Rules (Manual Enforcement)

Since GitHub branch protection rules are unavailable on the free organization
plan, follow these conventions manually to maintain consistency and safety:

### Branch Restrictions

| Rule | Description |
|------|--------------|
| **No direct commits to `main` or `dev`** | All changes must go through pull requests. |
| **Create feature branches from `dev`** | Use the pattern `feat/<feature-name>` (e.g. `feat/auth-register`). |
| **Never delete `main` or `dev`** | Keep these branches permanent and stable. |
| **Always pull latest `dev`** | Before starting a new branch: `git pull origin dev`. |
| **Merge via PR only** | No `git push` directly to `main` or `dev`. Use pull requests for review. |
| **Keep commits clean** | Squash or rebase before merging to keep history linear. |
| **Delete feature branches after merge** | Keeps the repo clean and avoids confusion. |

---

## Pull Request Rules

| Setting | Description |
|----------|--------------|
| ✅ **Require PR for all merges** | All work must be submitted through a pull request. |
| ✅ **At least 1 reviewer required** | Backend A or B must approve before merging. |
| ✅ **Dismiss stale approvals** | If new commits are pushed, previous approvals become invalid. |
| ✅ **Resolve all conversations** | No merge until all comments are addressed. |
| 🚫 **No direct pushes / force pushes** | Avoid overwriting commits on `main` or `dev`. |
| 🧹 **Use “Squash and Merge”** | Keeps `main` and `dev` commit history linear and tidy. |

---

## Example Workflow

```bash
# 1. Stay updated with dev
git checkout dev
git pull origin dev

# 2. Create a feature branch
git checkout -b feat/umk-crud

# 3. Work, commit, and push
git add .
git commit -m "feat: add UMK CRUD endpoints"
git push -u origin feat/umk-crud

# 4. Open a Pull Request
# Target: dev branch
# Reviewer: Backend A or Backend B

# 5. After approval and testing
# Merge PR using "Squash and Merge"
# Delete the branch after merge
```

---

## Merge Flow Summary

```plaintext
feat/*  →  dev  →  main
```

- `feat/*`: for all new work
- `dev`: integration branch for testing
- `main`: stable production-ready branch
