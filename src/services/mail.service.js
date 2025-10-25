import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import logger from '../config/logger.js'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Renders an HTML template and replaces {{variables}}.
 */
function renderTemplate(templateName, variables = {}) {
  const filePath = path.resolve('src/templates', `${templateName}.html`)
  let html = fs.readFileSync(filePath, 'utf-8')

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    html = html.replace(pattern, value ?? '')
  }

  return html
}

/**
 * Sends verification email with provided link.
 */
export async function sendVerificationEmail(to, name, verificationLink) {
  try {
    const html = renderTemplate('verify-email', { name, verificationLink })

    await transporter.sendMail({
      from: `"FinanSaku Support" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Verify your FinanSaku account',
      html,
    })

    logger.info(`✉️ Verification email sent to ${to}`)
  } catch (err) {
    logger.error(`❌ Failed to send verification email to ${to}: ${err.message}`)
    throw err
  }
}

/**
 * Sends password-reset email with provided link.
 */
export async function sendResetPasswordEmail(to, name, resetLink) {
  try {
    const html = renderTemplate('reset-password', { name, resetLink })

    await transporter.sendMail({
      from: `"FinanSaku Support" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Reset your FinanSaku password',
      html,
    })

    logger.info(`✉️ Password-reset email sent to ${to}`)
  } catch (err) {
    logger.error(`❌ Failed to send password-reset email to ${to}: ${err.message}`)
    throw err
  }
}
