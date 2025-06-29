import mongoose from 'mongoose';

mongoose.connect("mongodb://127.0.0.1:27017/medical-app ")
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));


const reportSchema = new mongoose.Schema({
  patientId: String,
  patientName: { type: String, default: 'Unknown Patient' },
  reportText: String, // This stores your exact generated report
  conversation: [{
    role: String,
    parts: [{
      text: String
    }]
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Report', reportSchema);