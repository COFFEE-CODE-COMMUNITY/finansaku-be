import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import handlebars from "handlebars"
import layouts from "handlebars-layouts"

// === Register base layout and helpers ===
const base = readFileSync(path.resolve("src/templates/base.html"), "utf8")
handlebars.registerPartial("base", base)
layouts.register(handlebars)

// === Auto-register all partials in /src/templates/partials ===
const partialsDir = path.resolve("src/templates/partials")
try {
  const files = readdirSync(partialsDir)
  files.forEach(file => {
    if (file.endsWith(".html")) {
      const name = path.basename(file, ".html")
      const content = readFileSync(path.join(partialsDir, file), "utf8")
      handlebars.registerPartial(name, content)
    }
  })
} catch {
  // intentionally empty — skip if partials directory doesn’t exist
}


// === Render any template with given context ===
export function renderTemplate(templateName, context = {}) {
  const filePath = path.resolve(`src/templates/${templateName}.html`)
  const html = readFileSync(filePath, "utf8")
  const compiled = handlebars.compile(html)
  return compiled(context)
}

// === Example usage (for manual preview only) ===
if (process.argv[1].endsWith("render-template.js")) {
  const output = renderTemplate("verify-email", {
    name: "John Doe",
    verifyUrl: "https://finansaku.com/verify",
  })

  console.log(output)
}
