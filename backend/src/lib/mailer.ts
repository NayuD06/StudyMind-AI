import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

type Mail = { to: string; subject: string; text: string }

// Thư đã "gửi" khi chạy test, để test đọc lại được liên kết trong thư
export const testOutbox: Mail[] = []

const transport = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null

// Chưa cấu hình SMTP thì in thư ra màn hình chạy backend, đủ để phát triển và demo trên máy
export async function sendMail(mail: Mail) {
  if (env.NODE_ENV === 'test') {
    testOutbox.push(mail)
    return
  }
  if (!transport) {
    console.log(`\n--- Thư gửi tới ${mail.to} (chưa cấu hình SMTP nên chỉ in ra đây) ---\n${mail.subject}\n\n${mail.text}\n---\n`)
    return
  }
  await transport.sendMail({ from: env.MAIL_FROM, ...mail })
}
