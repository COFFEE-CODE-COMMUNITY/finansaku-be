---
aliases: [contribution]
description: Collaboration and merge workflow guide for the FinanSaku backend team.
lastUpdated: 2025-10-12
maintainer: FinanSaku Backend Team
---
# Collaboration & Merge Workflow

This document describes how the **FinanSaku backend team** collaborates within
the project repository, including branch rules, pull request conventions, and
merge practices.

---

## 1. Branch Rules (Manual Enforcement)

Because the GitHub Free plan does not support automatic branch protection rules,
the team enforces the following conventions manually to ensure consistency and
repository safety.

### Branch Restrictions

| Rule | Description |
|------|--------------|
| **No direct commits to `main` or `dev`** | All changes must go through pull requests. |
| **Create feature branches from `dev`** | Use the format `feat/<feature-name>` (e.g., `feat/auth-register`). |
| **Never delete `main` or `dev`** | These branches are permanent and must remain stable. |
| **Always pull the latest `dev`** | Before creating a new branch, run `git pull origin dev`. |
| **Merge via Pull Requests only** | Avoid pushing directly to `main` or `dev`. Use PRs for review. |
| **Keep commits clean** | Use squash or rebase before merging to maintain a linear history. |
| **Delete merged branches** | Remove feature branches after merge to keep the repository tidy. |

---

## 2. Pull Request Rules

| Setting | Description |
|----------|--------------|
| **Require Pull Request for all merges** | All changes must be submitted through a PR. |
| **Minimum 1 reviewer required** | Another backend team member must approve before merging. |
| **Dismiss stale approvals** | New commits invalidate previous approvals. |
| **Resolve all conversations** | No PR may be merged with unresolved comments. |
| **No direct or force pushes** | Prevents overwriting commits in `main` or `dev`. |
| **Use “Squash and Merge”** | Keeps the commit history concise and consistent. |

---

## 3. Example Workflow

```bash
# 1. Stay updated with the latest development branch
git checkout dev
git pull origin dev

# 2. Create a new feature branch
git checkout -b feat/umk-crud

# 3. Work on changes, commit, and push
git add .
git commit -m "feat: add UMK CRUD endpoints"
git push -u origin feat/umk-crud

# 4. Open a Pull Request
# Target: dev branch
# Reviewer: Another backend team member

# 5. After approval and testing
# Merge using "Squash and Merge"
# Then delete the branch after merge
```

---

## 4. Merge Flow Summary

```bash
feat/*  →  dev  →  main
```

| Branch   | Purpose                                    |
| -------- | ------------------------------------------ |
| `feat/*` | Used for developing new features or fixes  |
| `dev`    | Integration branch for testing and staging |
| `main`   | Stable production-ready branch             |

---

## 5. Notes

- Use meaningful branch names (e.g., `feat/announcement-api` instead of
  `feat/new`).
- Keep PRs focused — one logical change per PR.
- Always pull the latest `dev` before starting new work to prevent merge
  conflicts.
- Treat `main` as production-only; merge into it only after thorough testing.
