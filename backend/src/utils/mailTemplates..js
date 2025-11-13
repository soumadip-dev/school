import { ENV } from '../config/env.config.js';

//* Function to generate mail options
export default function generateMailOptions({ user, otp, type }) {
  // Teal color palette matching the website theme
  const colors = {
    primary: '#0d9488', // teal-700
    secondary: '#115e59', // teal-800
    accent: '#0f766e', // teal-600
    light: '#f0fdfa', // teal-50
    dark: '#134e4a', // teal-900
    muted: '#64748b', // slate-500
    success: '#059669', // emerald-600
  };

  // Base container styles
  const containerStyles = `
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: ${colors.dark};
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    border-radius: 8px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  `;

  // Header styles
  const headerStyles = `
    color: ${colors.primary};
    font-size: 1.75rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  `;

  // OTP display styles
  const otpStyles = `
    background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
    color: white;
    padding: 1rem 1.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.5rem;
    text-align: center;
    margin: 2rem auto;
    border-radius: 8px;
    display: inline-block;
    box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
  `;

  // Footer styles
  const footerStyles = `
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 0.85rem;
    color: ${colors.muted};
  `;

  // Greeting component
  const greeting = `<p style="margin-bottom: 1.5rem;">Hello <strong>${user.name}</strong>,</p>`;

  // School header section with emojis
  const schoolHeader = `
    <div style="text-align: center; margin-bottom: 2rem;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🎓🏫📚</div>
      <h2 style="color: ${colors.secondary}; font-size: 1.25rem; font-weight: 600; margin: 0.5rem 0;">
        Jalpaiguri Zilla School 150 Years
      </h2>
      <h3 style="color: ${colors.primary}; font-size: 1.1rem; font-weight: 500; margin: 0;">
        JZS Alumni Portal
      </h3>
    </div>
  `;

  let subject, textMessage, htmlMessage;

  switch (type) {
    case 'welcome':
      subject = `Welcome to JZS Alumni Portal! 🎓`;
      textMessage = `Welcome to JZS Alumni Portal! Your account has been created successfully. We're thrilled to have you as part of our alumni community.`;
      htmlMessage = `
        <div style="${containerStyles}">
          ${schoolHeader}
          <h1 style="${headerStyles}">Welcome to JZS Alumni Portal! 🎉</h1>
          ${greeting}
          <p style="margin-bottom: 1rem;">A very warm welcome to the Jalpaiguri Zilla School Alumni Portal! We're absolutely delighted to have you join our growing community of alumni.</p>
          <p style="margin-bottom: 1.5rem;">This portal is your gateway to reconnecting with old friends, staying updated with school events, and being part of our 150-year legacy. 👥</p>
          
          <div style="background: ${
            colors.light
          }; padding: 1rem; border-radius: 8px; margin: 1.5rem 0;">
            <p style="margin: 0; font-size: 0.9rem; color: ${colors.dark};">
              <strong>📋 Get Started:</strong> Complete your profile, connect with batchmates, explore alumni directory, and stay updated with upcoming reunions and events.
            </p>
          </div>

          <div style="margin: 2rem 0; padding: 1.5rem; background: linear-gradient(135deg, ${
            colors.light
          } 0%, #e0f2f1 100%); border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 1rem; color: ${colors.dark}; font-weight: 500;">
              🎓 Relive Memories 🤝 Reconnect with Friends 🌟 Stay Involved
            </p>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <div style="font-size: 2rem; color: ${colors.primary};">🌟 📖 🏫</div>
          </div>

          <p style="margin-bottom: 1rem; font-size: 0.95rem;">
            We encourage you to explore all the features and update your profile to help fellow alumni find and connect with you.
          </p>
          
          <div style="${footerStyles}">
            <p style="margin: 0.5rem 0;">💁 Need assistance? Contact our alumni support team at <a href="mailto:${
              ENV.BREVO_SENDEREMAIL
            }" style="color: ${colors.primary};">${ENV.BREVO_SENDEREMAIL}</a></p>
            <p style="margin: 0.5rem 0;">© ${new Date().getFullYear()} Jalpaiguri Zilla School Alumni. Celebrating 150 Years of Excellence 🎉</p>
          </div>
        </div>
      `;
      break;

    case 'forgetPassword':
      subject = `Reset Your JZS Alumni Password 🔑`;
      textMessage = `You requested a password reset. Use the following One-Time Password (OTP) to reset your password: ${otp}\n\nIf you did not request this, please ignore this email. This OTP is valid for 15 minutes.`;
      htmlMessage = `
        <div style="${containerStyles}">
          ${schoolHeader}
          <h1 style="${headerStyles}">Password Reset Request 🔒</h1>
          ${greeting}
          <p style="margin-bottom: 1rem;">We received a request to reset the password for your JZS Alumni account.</p>
          <p style="margin-bottom: 1.5rem;">Please use the following OTP to reset your password:</p>
          
          <div style="${otpStyles}">${otp}</div>
          
          <p style="margin-bottom: 1rem; font-size: 0.9rem; color: ${colors.muted};">
            ⏰ This OTP is valid for 15 minutes. If you didn't request this password reset, you can safely ignore this email.
          </p>
          
          <div style="margin: 1.5rem 0; padding: 1rem; background: ${colors.light}; border-radius: 8px;">
            <p style="margin: 0; font-size: 0.9rem; color: ${colors.dark};">
              <strong>🔒 Security Tip:</strong> Choose a strong, unique password that you don't use for other accounts.
            </p>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <div style="font-size: 2rem; color: ${colors.primary};">🎓 → 🔑 → ✅</div>
          </div>
          
          <div style="${footerStyles}">
            <p style="margin: 0.5rem 0;">💁 Need help? Contact our alumni support team at <a href="mailto:${ENV.BREVO_SENDEREMAIL}" style="color: ${colors.primary};">${ENV.BREVO_SENDEREMAIL}</a></p>
            <p style="margin: 0.5rem 0; font-size: 0.8rem;">Jalpaiguri Zilla School - Celebrating 150 Years of Excellence 🎉</p>
          </div>
        </div>
      `;
      break;

    default:
      throw new Error('Unsupported email type');
  }

  return {
    from: `JZS Alumni Portal 🎓 <${ENV.BREVO_SENDEREMAIL}>`,
    to: user.email,
    subject,
    text: `Hello ${user.name},\n\n${textMessage}\n\nBest regards,\nThe JZS Alumni Team\nJalpaiguri Zilla School`,
    html: htmlMessage,
  };
}
