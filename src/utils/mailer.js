import fs from 'node:fs'
import path from 'node:path'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import handlebars from 'handlebars'
import layouts from 'handlebars-layouts'
import juice from 'juice'
import logger from '../config/logger.js'
import config from '../config/index.js'

// === Register base layout & helpers ===
const baseLayout = fs.readFileSync(path.resolve('src/templates/base.html'), 'utf8')
handlebars.registerPartial('base', baseLayout)
layouts.register(handlebars)

// === Load, compile, and inline HTML template ===
const loadTemplate = (templateName, variables = {}) => {
  const templatePath = path.resolve('src/templates', `${templateName}.html`)
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`)
  }

  const rawHtml = fs.readFileSync(templatePath, 'utf8')
  const compiled = handlebars.compile(rawHtml)
  const renderedHtml = compiled(variables)
  return juice(renderedHtml)
}

// === Choose mail transport (Resend or SMTP) ===
let mailClient = null

if (config.RESEND_API_KEY) {
  const resend = new Resend(config.RESEND_API_KEY)
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
    host: config.MAIL_HOST || 'smtp.gmail.com',
    port: Number(config.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: config.MAIL_USER,
      pass: config.MAIL_PASS,
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

// === Specific template senders ===
export const sendVerificationEmail = async (to, name, verifyUrl, baseUrl) => {
  const html = loadTemplate('verify-email', { name, verifyUrl, baseUrl })
  await sendEmail(to, 'Verifikasi Akun FinanSaku Anda', html)
}

export const sendResetPasswordEmail = async (to, name, resetUrl, baseUrl) => {
  const html = loadTemplate('reset-password', { name, resetUrl, baseUrl })
  await sendEmail(to, 'Atur Ulang Kata Sandi FinanSaku Anda', html)
}

export const sendEmailChangeConfirmation = async (to, name, confirmUrl, baseUrl) => {
  const html = loadTemplate('email-change', { name, confirmUrl, baseUrl })
  await sendEmail(to, 'Konfirmasi Perubahan Email FinanSaku', html)
}
