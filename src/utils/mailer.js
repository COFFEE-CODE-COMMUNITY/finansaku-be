import fs from 'node:fs'
import path from 'node:path'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import logger from '../config/logger.js'

// === Load HTML template and inject variables ===
const loadTemplate = (templateName, variables = {}) => {
  const templatePath = path.resolve('src/templates', `${templateName}.html`)
  let html = fs.readFileSync(templatePath, 'utf8')

  // Replace {{variable}} placeholders with actual values
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }

  return html
}

// === Choose mail transport ===
let mailClient = null

if (process.env.RESEND_API_KEY) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  mailClient = {
    send: async ({ to, subject, html }) => {
      await resend.emails.send({
        from: 'FinanSaku <no-reply@finansaku.com>',
        to,
        subject,
        html,
      })
    },
  }
  logger.info('📧 Using Resend mail service')
} else {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })
  mailClient = {
    send: async ({ to, subject, html }) => {
      await transporter.sendMail({
        from: 'FinanSaku <no-reply@finansaku.com>',
        to,
        subject,
        html,
      })
    },
  }
  logger.info('📨 Using Nodemailer (SMTP)')
}

// === Generic email sender ===
export const sendEmail = async (to, subject, html) => {
  try {
    await mailClient.send({ to, subject, html })
    logger.info(`📧 Email sent to ${to}`)
  } catch (err) {
    logger.error('❌ Email send error:', err)
  }
}

// === Specific templates ===
export const sendVerificationEmail = async (to, verifyUrl) => {
  const html = loadTemplate('verify-email', { verifyUrl })
  await sendEmail(to, 'Verify your FinanSaku account', html)
}

export const sendResetPasswordEmail = async (to, resetUrl) => {
  const html = loadTemplate('reset-password', { resetUrl })
  await sendEmail(to, 'Reset your FinanSaku password', html)
}

export const sendEmailChangeConfirmation = async (to, confirmUrl) => {
  const html = loadTemplate('email-change', { confirmUrl })
  await sendEmail(to, 'Confirm your new FinanSaku email address', html)
}
