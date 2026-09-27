import nodemailer from 'nodemailer';

let transporter = null;

// Initialize transporter
const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE || (user && user.includes('@gmail.com') ? 'gmail' : undefined);

  if (service && user && pass) {
    transporter = nodemailer.createTransport({
      service,
      auth: { user, pass }
    });
    console.log(`📧 [EmailService] Configured via service: ${service} for ${user}`);
    return transporter;
  }

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    console.log(`📧 [EmailService] Configured via SMTP host ${host}:${port} for ${user}`);
    return transporter;
  } else {
    // Development fallback (logs to console or creates ethereal test account)
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📧 [EmailService] Notice: No real SMTP credentials in .env. Using Ethereal test mailer for development.');
    } catch (e) {
      console.warn('📧 [EmailService] Fallback to mock email transporter:', e.message);
      transporter = {
        sendMail: async (opts) => {
          console.log(`📧 [MockEmail] To: ${opts.to} | Subject: ${opts.subject}`);
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  }

  return transporter;
};

/**
 * Send Blood Donation Appreciation Certificate & Receipt to Donor
 */
export const sendDonationCertificateEmail = async ({
  donorName,
  donorEmail,
  bloodGroup,
  unitsDonated,
  bagId,
  bloodBankName,
  bloodBankCity,
  donationDate,
  nextEligibleDate,
  certificateId
}) => {
  try {
    const mailer = await getTransporter();

    const formattedDate = new Date(donationDate || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const formattedNextDate = new Date(nextEligibleDate || (Date.now() + 90 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0 0 8px 0; font-size: 24px; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .cert-badge { display: inline-block; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; margin-top: 12px; }
        .body { padding: 32px 24px; }
        .salutation { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
        .msg { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
        .card-row:last-child { border-bottom: none; }
        .label { color: #64748b; font-weight: 500; }
        .value { color: #0f172a; font-weight: 700; }
        .highlight-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px; }
        .highlight-box p { margin: 0; font-size: 12px; color: #065f46; font-weight: 500; }
        .highlight-box h3 { margin: 4px 0 0 0; color: #047857; font-size: 16px; font-weight: 800; }
        .guidelines { font-size: 12px; color: #64748b; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; }
        .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Certificate of Appreciation</h1>
          <p>National Life-Saving Voluntary Blood Donation Network</p>
          <div class="cert-badge">Official Certificate ID: ${certificateId || 'CERT-' + Date.now()}</div>
        </div>

        <div class="body">
          <div class="salutation">Dear ${donorName},</div>
          <p class="msg">
            Thank you for your noble gesture and selfless contribution towards humanity! Your generous blood donation helps save up to <strong>3 precious lives</strong>. We salute your humanitarian spirit.
          </p>

          <div class="card">
            <div class="card-row">
              <span class="label">Donor Name:</span>
              <span class="value">${donorName}</span>
            </div>
            <div class="card-row">
              <span class="label">Blood Group:</span>
              <span class="value" style="color: #dc2626; font-size: 15px;">${bloodGroup}</span>
            </div>
            <div class="card-row">
              <span class="label">Units Donated:</span>
              <span class="value">${unitsDonated || 1} Unit (${(unitsDonated || 1) * 350} ml)</span>
            </div>
            <div class="card-row">
              <span class="label">Blood Bag Reference:</span>
              <span class="value" style="font-family: monospace;">${bagId || 'BAG-' + Date.now().toString().slice(-6)}</span>
            </div>
            <div class="card-row">
              <span class="label">Authorized Blood Bank:</span>
              <span class="value">${bloodBankName} (${bloodBankCity || 'India'})</span>
            </div>
            <div class="card-row">
              <span class="label">Date of Donation:</span>
              <span class="value">${formattedDate}</span>
            </div>
          </div>

          <div class="highlight-box">
            <p>Your Next Eligible Donation Date (after 90 days cooling period):</p>
            <h3>${formattedNextDate}</h3>
          </div>

          <div class="guidelines">
            <strong>Post-Donation Care:</strong> Stay well-hydrated, take adequate rest, avoid strenuous exercise or heavy lifting for the next 24 hours, and have nutritious meals.
          </div>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} SwasthyaSetu Healthcare Infrastructure. Verified digital certificate under National Blood Council standards.</p>
          <p>This is an automated notification. For any assistance, please reach out to emergency@swasthyasetu.org</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await mailer.sendMail({
      from: `"SwasthyaSetu Blood Services" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@swasthyasetu.org'}>`,
      to: donorEmail,
      subject: `🩸 Thank you for saving lives! Blood Donation Certificate (${certificateId})`,
      html
    });

    console.log(`📧 [EmailService] Certificate email sent to ${donorEmail}:`, info.messageId);
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`🔗 [EmailService] Test Email Web Preview URL: ${testUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl: testUrl };
  } catch (error) {
    console.error('📧 [EmailService] Failed to send donation certificate email:', error.message);
    return { success: false, error: error.message };
  }
};
