const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, guests, date, time, requests } = req.body;

  if (!name || !email || !phone || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Abby's Cafe Bun & Bean" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Your Table is Reserved — Abby\'s Cafe',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff8f6; border-radius: 16px; overflow: hidden; border: 1px solid #e8e1df;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #271310 0%, #3e2723 100%); padding: 40px 32px; text-align: center;">
            <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.15); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="font-size: 28px;">☕</span>
            </div>
            <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.3px;">Abby's Cafe Bun &amp; Bean</h1>
            <p style="color: rgba(255,255,255,0.6); margin: 6px 0 0; font-size: 13px;">Dapodi's Finest Artisan Cafe</p>
          </div>

          <!-- Green confirmation badge -->
          <div style="background: #f1f8e9; border-bottom: 1px solid #dcedc8; padding: 20px 32px; display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; background: #689F38; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span style="color: white; font-size: 18px;">✓</span>
            </div>
            <div>
              <p style="margin: 0; font-size: 15px; font-weight: 600; color: #33691e;">Table Reserved Successfully!</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #558b2f;">Your spot at Abby's is secured. See you soon!</p>
            </div>
          </div>

          <!-- Body -->
          <div style="padding: 32px;">
            <p style="font-size: 15px; color: #504442; margin: 0 0 24px;">Hi <strong>${name}</strong>, we're thrilled to host you at Abby's! Here's a summary of your reservation:</p>

            <!-- Booking details card -->
            <div style="background: #fff; border: 1px solid #e8e1df; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
              <div style="background: #faf2f0; padding: 12px 20px; border-bottom: 1px solid #e8e1df;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #75584d; font-weight: 600;">Booking Details</p>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f4eceb;">
                  <td style="padding: 14px 20px; font-size: 13px; color: #827472; width: 40%;">📅 Date</td>
                  <td style="padding: 14px 20px; font-size: 14px; color: #271310; font-weight: 600;">${date}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f4eceb;">
                  <td style="padding: 14px 20px; font-size: 13px; color: #827472;">⏰ Time Slot</td>
                  <td style="padding: 14px 20px; font-size: 14px; color: #271310; font-weight: 600;">${time}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f4eceb;">
                  <td style="padding: 14px 20px; font-size: 13px; color: #827472;">👥 Guests</td>
                  <td style="padding: 14px 20px; font-size: 14px; color: #271310; font-weight: 600;">${guests}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f4eceb;">
                  <td style="padding: 14px 20px; font-size: 13px; color: #827472;">📞 Phone</td>
                  <td style="padding: 14px 20px; font-size: 14px; color: #271310; font-weight: 600;">${phone}</td>
                </tr>
                ${requests ? `<tr>
                  <td style="padding: 14px 20px; font-size: 13px; color: #827472;">📝 Special Requests</td>
                  <td style="padding: 14px 20px; font-size: 14px; color: #271310;">${requests}</td>
                </tr>` : ''}
              </table>
            </div>

            <!-- Info note -->
            <div style="background: #fff3e0; border-left: 4px solid #FF9800; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #e65100;">
                <strong>📲 What's next?</strong> Our team will call you on <strong>${phone}</strong> shortly to confirm your reservation. If you have any questions, call us directly at <strong>098903 74040</strong>.
              </p>
            </div>

            <!-- Address -->
            <div style="text-align: center; padding: 20px; background: #faf2f0; border-radius: 12px;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #827472;">📍 Find us here</p>
              <p style="margin: 0; font-size: 14px; color: #271310; font-weight: 600;">Shop No. 10, Siddhi Towers, Ganesh Nagar</p>
              <p style="margin: 0; font-size: 13px; color: #504442;">Dapodi, Pimpri-Chinchwad, Pune 411012</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 32px; text-align: center; border-top: 1px solid #e8e1df;">
            <p style="margin: 0; font-size: 12px; color: #827472;">Abby's Cafe Bun &amp; Bean · Dapodi, Pune</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #827472;">Good vibes, amazing food, and the sweetest staff ☕</p>
          </div>

        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Confirmation email sent to ' + email });

  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Failed to send confirmation email.' });
  }
};
