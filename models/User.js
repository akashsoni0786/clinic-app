import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['admin', 'staff', 'patient'], required: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: String,
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
