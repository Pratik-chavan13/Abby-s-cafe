require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory (where index.html is)
app.use(express.static(__dirname));

// Route for the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Route for booking a table
app.post('/api/book-table', async (req, res) => {
    const { name, email, phone, guests, date, time, requests } = req.body;

    if (!name || !email || !phone || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Setup email data
        const mailOptions = {
            from: `"Abby's Cafe" <${process.env.EMAIL_USER}>`,
            to: email, // Send confirmation to the customer
            subject: 'Table Reservation Confirmation - Abby\'s Cafe',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #271310; text-align: center;">Abby's Cafe Bun & Bean</h2>
                    <p style="font-size: 16px; color: #504442;">Dear <strong>${name}</strong>,</p>
                    <p style="font-size: 16px; color: #504442;">Thank you for reserving a table with us. We are excited to host you!</p>
                    
                    <div style="background-color: #faf2f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #795c51;">Reservation Details:</h3>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
                        <p style="margin: 5px 0;"><strong>Guests:</strong> ${guests}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
                        ${requests ? `<p style="margin: 5px 0;"><strong>Special Requests:</strong> ${requests}</p>` : ''}
                    </div>
                    
                    <p style="font-size: 14px; color: #827472;">If you need to make any changes, please call us directly at 098903 74040.</p>
                    <p style="font-size: 14px; color: #827472;">See you soon!<br><strong>Abby's Cafe Team</strong></p>
                </div>
            `
        };

        // Send mail
        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: 'Reservation confirmed! An email has been sent.' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send confirmation email. Please try again later.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
