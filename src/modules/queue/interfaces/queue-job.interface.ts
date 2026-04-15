// EMAIL JOB TYPES
export enum EmailJobType {
  WELCOME_EMAIL = 'welcome-email',
  OTP_EMAIL = 'otp',
  PASSWORD_RESET = 'password-reset',
  REFERRAL_BONUS = 'referral-bonus',
  PAYMENT_CONFIRMATION = 'payment-confirmation',
  ACCOUNT_VERIFICATION = 'account-verification',
  
  RIDER_SUSPENDED = 'RIDER_SUSPENDED',
  RIDER_UNSUSPENDED = 'RIDER_UNSUSPENDED',

  RIDER_VERIFIED = 'RIDER_VERIFIED',
  RIDER_REJECTED = 'RIDER_REJECTED'
}

// NOTIFICATION JOB TYPES
export enum NotificationJobType {
  PUSH_NOTIFICATION = 'push-notification',
  SMS_NOTIFICATION = 'sms-notification'
}

// ============================================
// EMAIL JOB DATA INTERFACES
// ============================================

// Welcome Email
export interface WelcomeEmailJobData {
  userId: string;
  email: string;
  username?: string;
  referralCode: string;
}

// OTP Email
export interface OtpEmailJobData {
  userId: string;
  email: string;
  otp: string;
  expiresIn?: number; // minutes
  purpose?: 'login' | 'registration' | 'password-reset' | 'verification';
}

// Password Reset Email
export interface PasswordResetJobData {
  userId: string;
  email: string;
  resetToken: string;
  resetLink: string;
  expiresIn?: number; // minutes
}

// Referral Bonus Email
export interface ReferralBonusJobData {
  userId: string;
  email: string;
  username?: string;
  bonusAmount: number;
  referredUserName?: string;
}

// Payment Confirmation Email
export interface PaymentConfirmationJobData {
  userId: string;
  email: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionDate: Date;
}

// Account Verification Email
export interface AccountVerificationJobData {
  userId: string;
  email: string;
  verificationLink: string;
  verificationCode: string;
}


// NOTIFICATION JOB DATA INTERFACES
// Push Notification
export interface PushNotificationJobData {
  userId: string;
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, any>; // Additional custom data
  imageUrl?: string;
  clickAction?: string;
}

// SMS Notification
export interface SmsNotificationJobData {
  userId: string;
  phone: string;
  message: string;
  purpose?: 'otp' | 'alert' | 'marketing' | 'transactional';
}

// In-App Notification
export interface InAppNotificationJobData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
}

// ============================================
// UNION TYPES FOR TYPE SAFETY
// ============================================

// All Email Job Data Types
export type EmailJobData =
  | WelcomeEmailJobData
  | OtpEmailJobData
  | PasswordResetJobData
  | ReferralBonusJobData
  | PaymentConfirmationJobData
  | AccountVerificationJobData;

// All Notification Job Data Types
export type NotificationJobData =
  | PushNotificationJobData
  | SmsNotificationJobData
  | InAppNotificationJobData;


  // JOB OPTIONS INTERFACE
export interface QueueJobOptions {
  attempts?: number; // Number of retry attempts
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number; // Delay in milliseconds
  };
  delay?: number; // Delay before job execution (ms)
  priority?: number; // Job priority (higher = more important)
  removeOnComplete?: boolean | number | { age?: number; count?: number };
  removeOnFail?: boolean | number | { age?: number; count?: number };
  timeout?: number; // Job timeout in milliseconds
}

// JOB RESULT INTERFACES

// Generic Job Result
export interface JobResult {
  success: boolean;
  timestamp: Date;
  jobId?: string;
  error?: string;
}

// Email Job Result
export interface EmailJobResult extends JobResult {
  email: string;
  emailType: EmailJobType;
  messageId?: string; // Email service message ID
}

// Notification Job Result
export interface NotificationJobResult extends JobResult {
  userId: string;
  notificationType: NotificationJobType;
  deliveryStatus?: 'sent' | 'failed' | 'pending';
}


// JOB STATUS INTERFACE
export interface JobStatus {
  id: string;
  name: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress: number | object;
  attemptsMade: number;
  failedReason?: string;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  data: any;
}

// FAILED JOB INTERFACE
export interface FailedJobInfo {
  id: string;
  name: string;
  data: any;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
  stacktrace?: string[];
}

// QUEUE STATISTICS INTERFACE
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}


// TYPE GUARDS (Helper functions for type checking)
// Check if job data is Welcome Email
export function isWelcomeEmailJob(data: any): data is WelcomeEmailJobData {
  return 'referralCode' in data && 'email' in data && 'userId' in data;
}

// Check if job data is OTP Email
export function isOtpEmailJob(data: any): data is OtpEmailJobData {
  return 'otp' in data && 'email' in data && 'userId' in data;
}

// Check if job data is Push Notification
export function isPushNotificationJob(data: any): data is PushNotificationJobData {
  return 'fcmToken' in data && 'title' in data && 'body' in data;
}

// Check if job data is SMS Notification
export function isSmsNotificationJob(data: any): data is SmsNotificationJobData {
  return 'phone' in data && 'message' in data && 'userId' in data;
}
