import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import logger from '../config/logger.js'

// === Initialize Transporter ===
// Use Gmail (App Password required) or custom SMTP (e.g. Resend, Mailtrap)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// === Template Renderer ===
// Dynamically replace {{variables}} inside /src/templates/*.html
function renderTemplate(templateName, variables) {
  const templatePath = path.resolve('src/templates', `${templateName}.html`)
  let html = fs.readFileSync(templatePath, 'utf-8')

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    html = html.replace(pattern, value)
  }

  return html
}

// === Send Email Wrapper ===
async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"FinanSaku Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    logger.info(`📧 Email sent to ${to}: ${info.messageId}`)
  } catch (err) {
    logger.error(`❌ Failed to send email to ${to}: ${err.message}`)
    throw new Error('Email delivery failed')
  }
}

// === Send Verification Email ===
export async function sendVerificationEmail(to, name, link) {
  const html = renderTemplate('verify-email', {
    name,
    verificationLink: link,
  })
  await sendEmail({
    to,
    subject: 'Verify your FinanSaku account',
    html,
  })
}

// === Send Reset Password Email ===
export async function sendResetPasswordEmail(to, name, link) {
  const html = renderTemplate('reset-password', {
    name,
    resetLink: link,
  })
  await sendEmail({
    to,
    subject: 'Reset your FinanSaku password',
    html,
  })
}
