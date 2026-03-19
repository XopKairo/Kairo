import { z } from "zod";
import logger from "../utils/logger.js";

export const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errorMessages = result.error.errors.map(err => err.message).join(", ");
    logger.warn(`Validation error: ${errorMessages}`);
    return res.status(400).json({
      success: false,
      errors: result.error.errors.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      })),
    });
  }
  req.body = result.data;
  next();
};

export const schemas = {
  adminLogin: z.object({
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  }),
  userRegister: z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().regex(/^[0-9]{10,12}$/, "Invalid phone format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
  payoutRequest: z.object({
    amount: z.number().positive(),
    upiId: z.string().optional(),
    bankDetails: z.record(z.any()).optional(),
  }),
};
