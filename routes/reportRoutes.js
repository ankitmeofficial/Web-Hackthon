import express from 'express';
import reportController from '../controllers/reportController.js';

const router = express.Router();

router.get('/:patientId', reportController.getReport);


export default router;

