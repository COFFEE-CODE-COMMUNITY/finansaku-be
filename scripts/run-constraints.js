import dotenv from "dotenv"
import { execSync } from "child_process"

dotenv.config()

const directUrl = process.env.DIRECT_URL
if (!directUrl) {
  console.error("❌ DIRECT_URL not found in .env")
  process.exit(1)
}

console.log("Applying constraints to:", directUrl.split("@")[1].split("?")[0])

execSync(`psql "${directUrl}" -f docs/db_constraints.sql`, { stdio: "inherit" })
