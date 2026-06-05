const nodemailer = require('nodemailer');
const { isProd } = require('../config');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'iTrainer <no-reply@itrainer.local>';

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_HOST) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    // Fallback dev: log no console p/ permitir testar sem SMTP configurado.
    if (isProd) {
      throw new Error('SMTP nao configurado em producao.');
    }
    console.log('\n========== [DEV MAIL — SMTP not configured] ==========');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    console.log('=======================================================\n');
    return { dev: true };
  }
  return t.sendMail({ from: SMTP_FROM, to, subject, text, html });
}

module.exports = { sendMail };
