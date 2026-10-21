import { z } from "zod";

// Helper regexes
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /[0-9]/;
const SYMBOL_REGEX = /[^A-Za-z0-9]/;
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

// Password strength evaluator
export interface PasswordStrength {
  score: number; // 0 to 4
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  color: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUppercase = UPPERCASE_REGEX.test(password);
  const hasLowercase = LOWERCASE_REGEX.test(password);
  const hasNumber = NUMBER_REGEX.test(password);
  const hasSymbol = SYMBOL_REGEX.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSymbol) score++;

  if (password.length >= 12 && score === 4) {
    score = 4; // Very Strong
  }

  const levels: Record<number, { label: PasswordStrength["label"]; color: string }> = {
    0: { label: "Very Weak", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-orange-500" },
    2: { label: "Fair", color: "bg-amber-500" },
    3: { label: "Strong", color: "bg-cyan-500" },
    4: { label: "Very Strong", color: "bg-emerald-500" },
  };

  return {
    score,
    label: levels[score].label,
    color: levels[score].color,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
  };
}

// 1. Registration Schema
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((val) => {
        const dob = new Date(val);
        if (isNaN(dob.getTime())) return false;
        const today = new Date();
        const minAgeDate = new Date(
          today.getFullYear() - 13,
          today.getMonth(),
          today.getDate()
        );
        return dob <= minAgeDate && dob >= new Date(1900, 0, 1);
      }, "You must be at least 13 years old to register"),
    countryCode: z.string().min(1, "Country code is required"),
    phoneNumber: z
      .string()
      .trim()
      .min(7, "Phone number must be at least 7 digits")
      .max(15, "Phone number cannot exceed 15 digits")
      .refine((val) => /^\d{7,15}$/.test(val.replace(/[\s-]/g, "")), {
        message: "Enter a valid phone number (digits only)",
      }),
    streetAddress: z
      .string()
      .trim()
      .min(3, "Street address must be at least 3 characters")
      .max(150, "Street address cannot exceed 150 characters"),
    city: z
      .string()
      .trim()
      .min(2, "City must be at least 2 characters")
      .max(60, "City cannot exceed 60 characters"),
    state: z
      .string()
      .trim()
      .min(2, "State/Province must be at least 2 characters")
      .max(60, "State/Province cannot exceed 60 characters"),
    postalCode: z
      .string()
      .trim()
      .min(3, "Postal/ZIP code must be at least 3 characters")
      .max(20, "Postal code cannot exceed 20 characters"),
    country: z.string().min(2, "Please select your country"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(UPPERCASE_REGEX, "Must include at least one uppercase letter")
      .regex(LOWERCASE_REGEX, "Must include at least one lowercase letter")
      .regex(NUMBER_REGEX, "Must include at least one number")
      .regex(SYMBOL_REGEX, "Must include at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// 2. Sign-in Schema (supports email or phone number)
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Please enter your email or phone number")
    .refine((val) => {
      // Either valid email or phone format
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      const isPhone = PHONE_REGEX.test(val.replace(/[\s-]/g, ""));
      return isEmail || isPhone;
    }, "Please enter a valid email address or international phone number (e.g. +1234567890)"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// 3. Password Recovery: Step 1 (Email Request)
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid registered email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// 4. Password Recovery: Step 2 (OTP Verification)
export const otpVerificationSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, "OTP code must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP code must contain digits only"),
});

export type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>;

// 5. Password Recovery: Step 3 (Set New Password)
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(UPPERCASE_REGEX, "Must include at least one uppercase letter")
      .regex(LOWERCASE_REGEX, "Must include at least one lowercase letter")
      .regex(NUMBER_REGEX, "Must include at least one number")
      .regex(SYMBOL_REGEX, "Must include at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
