// sendEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config({path:'../.env'});

const sendCancellationEmail = async (to, customerName, reservationDetails) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Lolo's Place" <${process.env.EMAIL_USER}>`,
        to,
        subject: '❌ Reservation Cancelled',
        html: `
            <h2>Reservation Cancelled</h2>
            <p>Dear ${customerName},</p>
            <p>We regret to inform you that your reservation for ${reservationDetails} has been successfully cancelled.</p>
            <p>If you have any questions, feel free to contact us. We hope to serve you in the future!</p>
            <p>Best regards,</p>
            <p>Your Team</p>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendCancellationEmail;
