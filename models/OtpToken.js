import mongoose from 'mongoose';

const OtpTokenSchema = new mongoose.Schema(
  {
    purpose: { type: String, enum: ['password_reset', 'email_verification'], required: true },
    identifier: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OtpToken || mongoose.model('OtpToken', OtpTokenSchema);
