import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    contact_no: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true, trim: true },
    age: Number,
    gender: String,
    symptoms: [String],
    diseases: [String],
    medicines: [String],
    notes: String,
    fee: Number,
    legacyId: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
