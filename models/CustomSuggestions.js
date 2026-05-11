import mongoose from 'mongoose';

const CustomSuggestionsSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  medicines: { type: [String], default: [] },
  symptoms: { type: [String], default: [] },
  diseases: { type: [String], default: [] },
});

export default mongoose.models.CustomSuggestions ||
  mongoose.model('CustomSuggestions', CustomSuggestionsSchema);
