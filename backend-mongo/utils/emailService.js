import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // or any other email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Zora App Official" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Kairo Admin - Your OTP for Login",
    text: `Your OTP for Kairo Admin Login is: ${otp}. This OTP will expire in 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error.message);
    throw new Error(`Email Service Failed: ${error.message}`);
  }
};

export default { sendOTP };
