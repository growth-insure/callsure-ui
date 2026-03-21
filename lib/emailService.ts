import sgMail from '@sendgrid/mail';

interface EmailData {
  to: string;
  name: string;
  temporaryPassword: string;
  role: string;
  extension: string;
}

export async function sendWelcomeEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Check if SendGrid API key is configured
    const sendgridApiKey = process.env.NEXT_PUBLIC_SENDGRID_API_KEY;
    const fromEmail = process.env.NEXT_PUBLIC_SENDGRID_FROM_EMAIL;
    
    if (!sendgridApiKey) {
      
      return false; // Return false to indicate email was not sent
    }
    
    // Initialize SendGrid with API key
    sgMail.setApiKey(sendgridApiKey);
    
    // Prepare email message
    const msg = {
      to: emailData.to,
      from: fromEmail as string,
      subject: 'Welcome to CallSure - Your Account is Ready',
      html: generateEmailHTML(emailData),
    };
    
    await sgMail.send(msg);
    
    return true;
  } catch (error: unknown) {
    console.error("Failed to send welcome email:", error);
    if (typeof error === "object" && error) {
      const sgError = error as { response?: { body?: unknown } };
      if (sgError.response?.body) {
        console.error("SendGrid Error Details:", sgError.response.body);
      }
    }
    return false;
  }
}

function generateEmailHTML(emailData: EmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to CallSure</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #00BFA5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .password-box { background-color: #fff; border: 2px solid #00BFA5; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
        .password { font-family: monospace; font-size: 18px; font-weight: bold; color: #00BFA5; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to CallSure!</h1>
        </div>
        <div class="content">
          <h2>Hello ${emailData.name}!</h2>
          
          <p>Your account has been successfully created by your administrator. Here are your account details:</p>
          
          <ul>
            <li><strong>Email:</strong> ${emailData.to}</li>
            <li><strong>Role:</strong> ${emailData.role}</li>
            <li><strong>Extension:</strong> ${emailData.extension}</li>
          </ul>
          
          <h3>🔐 Your Password:</h3>
          <div class="password-box">
            <div class="password">${emailData.temporaryPassword}</div>
          </div>
          
          <h3>📋 Next Steps:</h3>
          <ol>
            <li>Go to the login page</li>
            <li>Use your email and the password above to log in</li>
            <li>We recommend changing your password after you log in</li>
          </ol>
          
          <div class="warning">
            <h4>⚠️ Important Security Notice:</h4>
            <ul>
              <li>Keep your password secure and do not share it with anyone</li>
              <li>If you did not request this account, please contact your administrator</li>
            </ul>
          </div>
          
          <p>If you have any questions or need assistance, please contact your system administrator.</p>
          
          <p>Best regards,<br>The CallSure Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
