import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  password: Joi.string().min(6).required(),
  nickname: Joi.string().allow(""),
  location: Joi.string().allow(""),
  // Optional for mobile app registration flow
  otp_verified_token: Joi.string(),
}).or("email", "phone");

export const loginSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  contact: Joi.string(),
  password: Joi.string().required(),
}).or("email", "phone", "contact");

export const verifyOTPSchema = Joi.object({
  contact: Joi.string().required(),
  otp: Joi.string().length(6).required(),
});

export const createOrderSchema = Joi.object({
  amount: Joi.number().positive().required(),
  coinPackageId: Joi.string().required(),
});

export const postUploadSchema = Joi.object({
  caption: Joi.string().allow(""),
  mediaType: Joi.string().valid("image", "video").required(),
  userId: Joi.string().required(),
});

export const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
