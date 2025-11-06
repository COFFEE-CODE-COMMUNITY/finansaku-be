import dotenv from "dotenv"
import nodemailer from "nodemailer"
import fs from "node:fs"
import path from "node:path"
import handlebars from "handlebars"
import layouts from "handlebars-layouts"
import juice from "juice"
import config from '../src/config/index.js'

dotenv.config()

// Usage:
//   node tests/mailTest.js verify-email "John Doe" you@mail.com
//   node tests/mailTest.js all "John Doe" you@mail.com
const [templateArg, nameArg, emailArg, urlArg] = process.argv.slice(2)
const templateName = templateArg || "verify-email"
const testName = nameArg || "John Doe"
const testEmail = emailArg || "slwachyu@gmail.com"

const defaultUrl = {
  "verify-email": "https://finansaku.com/verify",
  "reset-password": "https://finansaku.com/reset",
  "email-change": "https://finansaku.com/confirm",
}
const testUrl = urlArg || defaultUrl[templateName] || defaultUrl["verify-email"]

console.log(`🧩 Using template: ${templateName}`)
console.log(`📩 Recipient: ${testEmail}`)
console.log(`👤 Name: ${testName}`)
console.log(`🔗 URL: ${testUrl}\n`)

// Register base & helpers
const baseLayout = fs.readFileSync(path.resolve("src/templates/base.html"), "utf8")
handlebars.registerPartial("base", baseLayout)
layouts.register(handlebars)

const transporter = nodemailer.createTransport({
  host: config.MAIL_HOST || "smtp.gmail.com",
  port: Number(config.MAIL_PORT) || 587,
  secure: false,
  auth: { user: config.MAIL_USER, pass: config.MAIL_PASS },
})

async function sendTemplateEmail(tplName) {
  const templatePath = path.resolve(`src/templates/${tplName}.html`)
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`)
    return
  }

  const rawHtml = fs.readFileSync(templatePath, "utf8")
  const compiled = handlebars.compile(rawHtml)
  let html = compiled({
    name: testName,
    verifyUrl: testUrl,
    resetUrl: testUrl,
    confirmUrl: testUrl,
  })
  html = juice(html)

  try {
    const info = await transporter.sendMail({
      from: `"FinanSaku Team" <${config.MAIL_FROM_EMAIL}>`,
      to: testEmail,
      subject: `FinanSaku Email Test ✅ (${tplName})`,
      html,
    })
    console.log(`✅ Message sent: ${info.messageId} (${tplName})`)
  } catch (err) {
    console.error(`❌ Failed to send ${tplName}:`, err?.message || err)
  }
}

if (templateName === "all") {
  for (const tpl of ["verify-email", "reset-password", "email-change"]) {
    console.log(`\n🚀 Sending: ${tpl}`)
    await sendTemplateEmail(tpl)
  }
  console.log("\n🎉 All test emails attempted.")
} else {
  await sendTemplateEmail(templateName)
}
