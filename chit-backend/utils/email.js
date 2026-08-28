import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Brand assets – logo theme colors matched to PDF/website (Navy #1B365D, Gold #E58E26)
const LOGO_URL = "https://advaytraders.in/images/Advay-Traders-Logo.png";
const BRAND_NAVY = "#1B365D";
const BRAND_GOLD = "#E58E26";

const generateAdminEmailHTML = (data) => {
  const { customer, cart, totalItems, totalPrice, agentId } = data;
  const cartItemsHTML = cart
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(
            (item.discountPrice || item.price) * item.quantity
          ).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header with Logo – Navy (#1B365D) + Gold (#E58E26) brand theme -->
      <div style="background: ${BRAND_NAVY}; padding: 24px 20px; border-radius: 10px 10px 0 0; text-align: center; border-bottom: 4px solid ${BRAND_GOLD};">
        <img src="${LOGO_URL}" alt="Advay Traders Logo" width="180" style="max-width: 180px; height: auto; background: #ffffff; padding: 8px 14px; border-radius: 8px; display: block; margin: 0 auto 14px auto; border: 1px solid #e2e8f0;" />
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.3px;">🔔 New Enquiry Received</h1>
        <p style="color: ${BRAND_GOLD}; margin: 6px 0 0 0; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Advay Traders • Sivakasi</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: ${BRAND_NAVY}; margin-top: 0; border-bottom: 2px solid ${BRAND_GOLD}; padding-bottom: 10px;">Customer Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; width: 150px;">Name:</td>
              <td style="padding: 8px 0;">${customer.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${customer.email}" style="color: ${BRAND_NAVY};">${customer.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Phone:</td>
              <td style="padding: 8px 0;"><a href="tel:${customer.phone}" style="color: ${BRAND_NAVY};">${customer.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Agent ID:</td>
              <td style="padding: 8px 0;">${agentId ? `<span style="background:${BRAND_NAVY}; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">${agentId}</span>` : "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; vertical-align: top;">Address:</td>
              <td style="padding: 8px 0;">${customer.address}, ${customer.pincode}</td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: ${BRAND_NAVY}; margin-top: 0; border-bottom: 2px solid ${BRAND_GOLD}; padding-bottom: 10px;">Order Summary</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background: ${BRAND_NAVY}; color: white;">
                <th style="padding: 12px; text-align: left;">Product</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${cartItemsHTML}
            </tbody>
          </table>
          <div style="text-align: right; font-size: 18px; font-weight: bold; color: ${BRAND_NAVY}; padding-top: 15px; border-top: 2px solid #e2e8f0;">
            Total: ₹${totalPrice.toFixed(2)} (${totalItems} items)
          </div>
        </div>

        <div style="text-align: center; padding: 20px; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
          <p style="margin: 0; color: #92400e; font-weight: 500;">
            Please process this enquiry in the admin panel.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
        <p style="margin:0;">Advay Traders - Enquiry Management System</p>
        <p style="margin:4px 0 0 0; font-size:11px; color:#94a3b8;">Sivakasi - Sattur Main Road, Sivakasi - 626189 | 96881 17904</p>
      </div>
    </body>
    </html>
  `;
};

const generateCustomerEmailHTML = (data) => {
  const { customer, cart, totalItems, totalPrice, agentId } = data;
  const cartItemsHTML = cart
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(
            (item.discountPrice || item.price) * item.quantity
          ).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header with Logo – Navy (#1B365D) + Gold (#E58E26) brand theme -->
      <div style="background: ${BRAND_NAVY}; padding: 24px 20px; border-radius: 10px 10px 0 0; text-align: center; border-bottom: 4px solid ${BRAND_GOLD};">
        <img src="${LOGO_URL}" alt="Advay Traders Logo" width="180" style="max-width: 180px; height: auto; background: #ffffff; padding: 8px 14px; border-radius: 8px; display: block; margin: 0 auto 14px auto; border: 1px solid #e2e8f0;" />
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.3px;">✅ Enquiry Submitted Successfully</h1>
        <p style="color: ${BRAND_GOLD}; margin: 6px 0 0 0; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Advay Traders • Sivakasi</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px; color: #333;">Dear <strong>${customer.name}</strong>,</p>
        
        <p style="color: #475569;">Thank you for your enquiry with <strong>Advay Traders</strong>. We have received your order details and our team will contact you shortly to confirm and process your order.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: ${BRAND_NAVY}; margin-top: 0; border-bottom: 2px solid ${BRAND_GOLD}; padding-bottom: 10px;">Your Order Summary</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background: ${BRAND_NAVY}; color: white;">
                <th style="padding: 12px; text-align: left;">Product</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${cartItemsHTML}
            </tbody>
          </table>
          <div style="text-align: right; font-size: 18px; font-weight: bold; color: ${BRAND_NAVY}; padding-top: 15px; border-top: 2px solid #e2e8f0;">
            Total: ₹${totalPrice.toFixed(2)} (${totalItems} items)
          </div>
        </div>

        <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fcd34d; margin: 20px 0;">
          <h3 style="color: ${BRAND_NAVY}; margin: 0 0 10px 0; font-size: 14px; border-bottom: 1px solid ${BRAND_GOLD}; padding-bottom: 6px;">Delivery Details</h3>
          <p style="margin: 5px 0; color: #1e293b;"><strong>Address:</strong> ${customer.address}, ${customer.pincode}</p>
          <p style="margin: 5px 0; color: #1e293b;"><strong>Phone:</strong> ${customer.phone}</p>
          <p style="margin: 5px 0; color: #1e293b;"><strong>Agent ID:</strong> ${agentId ? `<span style="background:${BRAND_NAVY}; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">${agentId}</span>` : "Not provided"}</p>
        </div>

        <p style="color: #475569;">If you have any questions, please reply to this email or contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: ${BRAND_NAVY}; font-weight: 600;">${process.env.EMAIL_USER}</a>.</p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
        
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">
          Thank you for choosing Advay Traders!<br>
          <strong style="color: ${BRAND_NAVY};">Team Advay Traders</strong>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
        <p style="margin:0;">This is an automated confirmation email. Please do not reply directly to this message.</p>
        <p style="margin:4px 0 0 0; font-size:11px; color:#94a3b8;">Sivakasi - Sattur Main Road, Sivakasi - 626189 | 96881 17904</p>
      </div>
    </body>
    </html>
  `;
};

export const sendEnquiryEmails = async (data) => {
  const { customer, cart, totalItems, totalPrice, agentId } = data;
  const adminEmail = process.env.EMAIL_USER;

  const emailData = { customer, cart, totalItems, totalPrice, agentId };

  // Send email to admin
  const adminMailOptions = {
    from: `"Advay Traders Enquiry" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `🔔 New Enquiry from ${customer.name} - ₹${totalPrice.toFixed(2)}`,
    html: generateAdminEmailHTML(emailData),
  };

  // Send confirmation email to customer
  const customerMailOptions = {
    from: `"Advay Traders" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: `✅ Enquiry Confirmation - Advay Traders (₹${totalPrice.toFixed(2)})`,
    html: generateCustomerEmailHTML(emailData),
  };

  try {
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(customerMailOptions),
    ]);
    console.log("✅ Enquiry emails sent successfully to admin and customer");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send enquiry emails:", error);
    throw error;
  }
};

export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified");
    return true;
  } catch (error) {
    console.error("❌ SMTP connection failed:", error);
    return false;
  }
};