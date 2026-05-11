import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
    requesterContact: {
      name: String,
      phone: String,
      email: String,
    },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'completed', 'cancelled', 'no_show'],
      required: true,
    },
    preferredAt: Date,
    scheduledAt: Date,
    assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    rejectionReason: String,
    createdBy: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

AppointmentSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
