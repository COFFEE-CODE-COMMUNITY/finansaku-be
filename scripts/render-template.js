import { readFileSync } from "node:fs"
import path from "node:path"
import handlebars from "handlebars"
import layouts from "handlebars-layouts"

// === Register base layout and helpers ===
const base = readFileSync(path.resolve("src/templates/base.html"), "utf8")
handlebars.registerPartial("base", base)
layouts.register(handlebars)

// === Compile the verify-email template ===
const html = readFileSync(path.resolve("src/templates/verify-email.html"), "utf8")
const compiled = handlebars.compile(html)
const output = compiled({
  name: "John Doe",
  verifyUrl: "https://finansaku.com/verify",
})

console.log(output)
