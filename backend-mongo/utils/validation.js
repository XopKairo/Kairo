import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  password: Joi.string().min(6).optional(),
  nickname: Joi.string().allow(""),
  location: Joi.string().allow(""),
  gender: Joi.string().valid("Male", "Female", "Other").optional(),
  dob: Joi.date().iso().optional(),
  state: Joi.string().allow("").optional(),
  district: Joi.string().allow("").optional(),
  profilePicture: Joi.string().allow("").optional(),
  languages: Joi.array().items(Joi.string()).optional(),
  // Optional for mobile app registration flow
  otp_verified_token: Joi.string(),
});

export const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  contact: Joi.string().required(),
  otp_verified_token: Joi.string(),
  password: Joi.string().optional(),
});

export const verifyOTPSchema = Joi.object({
  contact: Joi.string().required(),
  otp: Joi.string().length(4).required(),
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
