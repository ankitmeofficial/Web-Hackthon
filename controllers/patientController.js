import Report from '../models/Report.js';

const patientController = {
  // Get all patients with pagination and search
  async getPatients(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const searchQuery = req.query.search || '';
      
      // Build search filter
      let filter = {};
      if (searchQuery) {
        filter = {
          $or: [
            { patientId: { $regex: searchQuery, $options: 'i' } },
            { 'conversation.parts.text': { $regex: searchQuery, $options: 'i' } }
          ]
        };
      }
      
      // Get total count for pagination
      const totalPatients = await Report.countDocuments(filter);
      const totalPages = Math.ceil(totalPatients / limit);
      
      // Get patients with pagination
      const patients = await Report.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      // Use stored patient names
      const patientsWithNames = patients.map(patient => ({
        ...patient.toObject(),
        patientName: patient.patientName || 'Unknown Patient'
      }));
      
      res.render('patients', {
        patients: patientsWithNames,
        currentPage: page,
        totalPages,
        searchQuery,
        extractSymptoms: (conversation) => {
          const symptoms = [];
          const medicalKeywords = [
            'pain', 'symptom', 'hurt', 'feel', 'cough', 'fever', 
            'nausea', 'headache', 'dizziness', 'rash', 'stomach',
            'chest', 'back', 'leg', 'arm', 'head', 'throat'
          ];
          
          conversation.forEach(entry => {
            if (entry.role === 'user') {
              const text = entry.parts[0].text.toLowerCase();
              if (medicalKeywords.some(keyword => text.includes(keyword))) {
                symptoms.push(entry.parts[0].text);
              }
            }
          });
          
          return symptoms;
        }
      });
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).render('error', { message: 'Error fetching patients' });
    }
  },

  // Get individual patient details
  async getPatientDetails(req, res) {
    try {
      const { patientId } = req.params;
      const patient = await Report.findOne({ patientId });
      
      if (!patient) {
        return res.status(404).render('error', { message: 'Patient not found' });
      }
      
      res.render('patient-details', { patient });
    } catch (error) {
      console.error('Error fetching patient details:', error);
      res.status(500).render('error', { message: 'Error fetching patient details' });
    }
  }
};

export default patientController; 