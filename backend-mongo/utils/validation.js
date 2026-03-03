const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  password: Joi.string().min(6).required(),
  nickname: Joi.string().allow(''),
  location: Joi.string().allow('')
}).or('email', 'phone');

const loginSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  contact: Joi.string(),
  password: Joi.string().required()
}).or('email', 'phone', 'contact');

const verifyOTPSchema = Joi.object({
  contact: Joi.string().required(),
  otp: Joi.string().length(6).required()
});

const createOrderSchema = Joi.object({
  amount: Joi.number().positive().required(),
  coinPackageId: Joi.string().required()
});

const postUploadSchema = Joi.object({
  caption: Joi.string().allow(''),
  mediaType: Joi.string().valid('image', 'video').required(),
  userId: Joi.string().required()
});

const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  createOrderSchema,
  postUploadSchema,
  validateRequest
};
