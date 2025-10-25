import dotenv from "dotenv"
import nodemailer from "nodemailer"

dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false, // use TLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

async function testMail() {
  try {
    const info = await transporter.sendMail({
      from: `"FinanSaku Team" <${process.env.MAIL_FROM_EMAIL}>`,
      to: "slwachyu@gmail.com",
      subject: "FinanSaku Email Test ✅",
      text: "Hello from FinanSaku backend!",
    })
    console.log("✅ Message sent:", info.messageId)
  } catch (err) {
    console.error("❌ Failed to send email:", err)
  }
}

testMail()
