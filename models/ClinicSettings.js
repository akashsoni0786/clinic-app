import mongoose from 'mongoose';

const SmtpSchema = new mongoose.Schema(
  {
    host: String,
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    user: String,
    pass: String,
    from: String,
  },
  { _id: false }
);

const ClinicSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    timings: { type: String, default: '' },
    services: { type: [String], default: [] },
    about: { type: String, default: '' },
    stampImage: { type: String, default: null },
    signatureImage: { type: String, default: null },
    smtp: { type: SmtpSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.ClinicSettings ||
  mongoose.model('ClinicSettings', ClinicSettingsSchema);
