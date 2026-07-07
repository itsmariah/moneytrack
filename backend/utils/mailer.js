const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordResetEmail(to, resetUrl) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'MoneyTrack — Redefinição de senha',
    html: `
      <p>Você solicitou a redefinição da sua senha no MoneyTrack.</p>
      <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a></p>
      <p>Este link expira em 1 hora. Se você não solicitou isso, ignore este e-mail.</p>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
