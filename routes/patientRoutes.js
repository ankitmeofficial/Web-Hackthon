import express from 'express';
import patientController from '../controllers/patientController.js';

const router = express.Router();

router.get('/', patientController.getPatients);
router.get('/:patientId', patientController.getPatientDetails);

export default router; 