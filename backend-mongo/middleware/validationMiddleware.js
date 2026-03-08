import Joi from "joi";
import logger from "../utils/logger.js";

export const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    logger.warn(
      `Validation error: ${error.details.map((d) => d.message).join(", ")}`,
    );
    return res.status(400).json({
      success: false,
      errors: error.details.map((d) => ({
        field: d.path[0],
        message: d.message,
      })),
    });
  }
  next();
};

export const schemas = {
  adminLogin: Joi.object({
    username: Joi.string().required().trim(),
    password: Joi.string().required(),
  }),
  userRegister: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string()
      .required()
      .pattern(/^[0-9]{10,12}$/),
    password: Joi.string().min(6).required(),
  }),
  payoutRequest: Joi.object({
    amount: Joi.number().positive().required(),
    upiId: Joi.string().optional(),
    bankDetails: Joi.object().optional(),
  }),
};
