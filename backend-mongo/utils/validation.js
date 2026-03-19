import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  nickname: z.string().optional(),
  location: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  dob: z.string().datetime().optional().or(z.date().optional()),
  state: z.string().optional(),
  district: z.string().optional(),
  profilePicture: z.string().optional(),
  languages: z.array(z.string()).optional(),
  otp_verified_token: z.string().optional(),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format").optional(),
  contact: z.string().min(1, "Contact is required"),
  otp_verified_token: z.string().optional(),
  password: z.string().optional(),
});

export const verifyOTPSchema = z.object({
  contact: z.string().min(1, "Contact is required"),
  otp: z.string().length(4, "OTP must be exactly 4 characters"),
});

export const createOrderSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  coinPackageId: z.string().min(1, "Coin Package ID is required"),
});

export const postUploadSchema = z.object({
  caption: z.string().optional(),
  mediaType: z.enum(["image", "video"], { required_error: "Media type must be image or video" }),
  userId: z.string().min(1, "User ID is required"),
});

export const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: result.error.errors[0].message });
  }
  req.body = result.data;
  next();
};
