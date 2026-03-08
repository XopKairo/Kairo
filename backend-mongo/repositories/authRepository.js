import OTP from "../models/OTP.js";

class AuthRepository {
  async findOtpByContact(contact) {
    return await OTP.findOne({ contact });
  }

  async updateOtp(contact, otp, expiresAt) {
    return await OTP.findOneAndUpdate(
      { contact },
      { otp, expiresAt },
      { upsert: true, new: true },
    );
  }

  async deleteOtp(contact) {
    return await OTP.deleteOne({ contact });
  }
}

export default new AuthRepository();
