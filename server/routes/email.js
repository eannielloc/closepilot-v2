const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'closepilotai@gmail.com',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = process.env.SMTP_FROM || 'ClosePilot <closepilotai@gmail.com>';
const APP_URL = process.env.APP_URL || 'https://closepilot-v2-production.up.railway.app';

function emailTemplate(content) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
  .wrapper{max-width:600px;margin:0 auto;padding:40px 20px}
  .card{background:linear-gradient(135deg,rgba(30,34,53,0.95),rgba(22,25,37,0.95));border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px;backdrop-filter:blur(20px)}
  .logo{font-size:24px;font-weight:700;color:#6366f1;letter-spacing:-0.5px;margin-bottom:24px}
  .logo span{color:#34d399}
  h2{color:#fff;font-size:22px;margin:0 0 8px}
  p{color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 16px}
  .detail{background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin:20px 0}
  .detail-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
  .detail-label{color:rgba(255,255,255,0.4)}
  .detail-value{color:#fff;font-weight:500}
  .cta{display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff!important;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:600;font-size:16px;margin:24px 0;text-align:center}
  .cta:hover{background:linear-gradient(135deg,#4f46e5,#4338ca)}
  .footer{text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06)}
  .footer p{color:rgba(255,255,255,0.25);font-size:12px}
</style></head>
<body><div class="wrapper"><div class="card">
  <div class="logo">Close<span>Pilot</span></div>
  ${content}
  <div class="footer"><p>Powered by ClosePilot — AI-Powered Transaction Coordination</p></div>
</div></div></body></html>`;
}

async function sendSignatureRequestEmail({ signerName, signerEmail, documentName, agentName, agentFirm, propertyAddress, signToken }) {
  const signUrl = `${APP_URL}/sign/${signToken}`;
  const html = emailTemplate(`
    <h2>Signature Requested</h2>
    <p>Hi ${signerName},</p>
    <p><strong>${agentName}</strong>${agentFirm ? ` from ${agentFirm}` : ''} has requested your signature on a document.</p>
    <div class="detail">
      <div class="detail-row"><span class="detail-label">Document</span><span class="detail-value">${documentName}</span></div>
      <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${propertyAddress}</span></div>
    </div>
    <div style="text-align:center">
      <a href="${signUrl}" class="cta">Review &amp; Sign</a>
    </div>
    <p style="font-size:13px;color:rgba(255,255,255,0.3)">If the button doesn't work, copy this link: ${signUrl}</p>
  `);

  return transporter.sendMail({
    from: FROM,
    to: signerEmail,
    subject: `Signature requested: ${documentName}`,
    html,
  });
}

async function sendMilestoneReminderEmail({ recipientName, recipientEmail, milestoneName, milestoneDate, propertyAddress, daysUntil }) {
  const urgency = daysUntil <= 1 ? '🔴 Due today!' : daysUntil <= 3 ? '🟡 Due soon' : `📅 Due in ${daysUntil} days`;
  const html = emailTemplate(`
    <h2>Upcoming Deadline</h2>
    <p>Hi ${recipientName},</p>
    <p>This is a reminder about an upcoming milestone for your transaction.</p>
    <div class="detail">
      <div class="detail-row"><span class="detail-label">Milestone</span><span class="detail-value">${milestoneName}</span></div>
      <div class="detail-row"><span class="detail-label">Due Date</span><span class="detail-value">${milestoneDate}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${urgency}</span></div>
      <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${propertyAddress}</span></div>
    </div>
    <div style="text-align:center">
      <a href="${APP_URL}/login" class="cta">View in ClosePilot</a>
    </div>
  `);

  return transporter.sendMail({
    from: FROM,
    to: recipientEmail,
    subject: `Deadline reminder: ${milestoneName} — ${propertyAddress}`,
    html,
  });
}

async function sendWelcomeEmail({ name, email }) {
  const html = emailTemplate(`
    <h2>Welcome to ClosePilot! 🎉</h2>
    <p>Hi ${name},</p>
    <p>Your account is set up and ready to go. ClosePilot helps you manage real estate transactions with AI-powered contract parsing, e-signatures, milestone tracking, and more.</p>
    <div style="text-align:center">
      <a href="${APP_URL}/login" class="cta">Get Started</a>
    </div>
    <p>Questions? Just reply to this email — we're here to help.</p>
  `);

  return transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Welcome to ClosePilot',
    html,
  });
}

module.exports = { sendSignatureRequestEmail, sendMilestoneReminderEmail, sendWelcomeEmail };
