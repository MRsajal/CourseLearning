const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-gmail@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Route to send review email
router.post('/send-review', async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;

    // Validate required fields
    if (!name || !email || !rating || !message) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    // Create star display for email
    const starDisplay = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-gmail@gmail.com',
      to: 'eduplatform@gmail.com',
      subject: `New Website Review - ${rating}/5 Stars`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #667eea; text-align: center;">New Website Review</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Review Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Rating:</strong> ${starDisplay} (${rating}/5)</p>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h4 style="margin-top: 0; color: #333;">Review Message:</h4>
            <p style="line-height: 1.6; color: #555;">${message}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px;">
            <p style="margin: 0; color: #1976d2; font-size: 14px;">
              This review was submitted through the EduPlatform website
            </p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
              Received on: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
      text: `
        New Website Review
        
        Name: ${name}
        Email: ${email}
        Rating: ${rating}/5 stars
        
        Message:
        ${message}
        
        Submitted on: ${new Date().toLocaleString()}
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true, 
      message: 'Review sent successfully! Thank you for your feedback.' 
    });

  } catch (error) {
    console.error('Error sending review email:', error);
    res.status(500).json({ 
      error: 'Failed to send review. Please try again later.' 
    });
  }
});

module.exports = router;
