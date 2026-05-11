import mongoose from 'mongoose';

const BillItemSchema = new mongoose.Schema(
  {
    description: String,
    qty: Number,
    rate: Number,
    amount: Number,
  },
  { _id: false }
);

const BillSchema = new mongoose.Schema(
  {
    billNumber: { type: String, required: true, unique: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    items: [BillItemSchema],
    total: { type: Number, required: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Bill || mongoose.model('Bill', BillSchema);
