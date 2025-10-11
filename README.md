# FinanSaku Backend

(THIS IS A WORK IN PROGRESS)

Backend service for **FinanSaku**, a budgeting and UMK-based financial tracker
 app by Coffee Code Community.

---

## Tech Stack
- **Node.js** + **Express**
- **Prisma ORM**
- **PostgreSQL** (Supabase)
- **JWT Authentication**
- **PM2 + Nginx** for deployment (on finansaku.space)

---

## 🧩 Folder Structure

```
finansaku-be/
├─ prisma/              # Prisma schema & migrations
├─ src/
│  ├─ routes/           # Express route definitions
│  ├─ controllers/      # Handles API logic
│  ├─ services/         # Business logic
│  ├─ middlewares/      # Auth / validation middleware
│  ├─ models/           # (Optional) non-Prisma data models
│  ├─ utils/            # Helpers / utilities
│  └─ app.js            # Main server file
├─ .env.example         # Example environment variables
├─ .gitignore
├─ package.json
└─ README.md
```

---

## ⚙️ Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env example
cp .env.example .env

# 3. Run in development mode
npm run dev
```

---

## 🗄️ Database (Prisma)

```bash
# Initialize Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

---

## 🧠 Conventions

* Branch: `dev` → development, `main` → production
* Commits follow [Conventional Commits](./docs/commit-guide.md)

---

## 🧾 Documentation

See the [`/docs`](./docs/) folder for:

* API references
* ERD diagrams
* Backend setup guide
