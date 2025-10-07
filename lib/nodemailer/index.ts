import nodemailer from 'nodemailer'
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from '@/lib/nodemailer/templates'

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD
  }
})

export const sendWelcomeEmail = async ({
  email,
  name,
  intro
}: WelcomeEmailData) => {
    
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE
  .replace('{{name}}', name)
  .replace('{{intro}}', intro)

  const mailOptions = {
    from: `"FinFlow" <finflow@stockbell.com>`,
    to: email,
    subject: 'Welcome to FinFlow - your stock market toolkit is ready!',
    text: 'Thanks for joining FinFlow.',
    html: htmlTemplate,
  }

  await transporter.sendMail(mailOptions)
}

export const sendDailyNewsSummaryEmail = async ({
  email,
  newsContent,
  date
}: DailyNewsSummaryEmailData) => {
  const currentDate = date || new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
    .replace('{{date}}', currentDate)
    .replace('{{newsContent}}', newsContent)

  const mailOptions = {
    from: `"FinFlow" <finflow@stockbell.com>`,
    to: email,
    subject: `Market News Summary - ${currentDate}`,
    text: `Today's market news summary from FinFlow.`,
    html: htmlTemplate,
  }

  await transporter.sendMail(mailOptions)
}
