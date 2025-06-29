import express from 'express';
import chatController from '../controllers/chatController.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.render('chat/welcome')
    });
router.get('/new', chatController.startNewChat);
router.get('/:sessionId', (req, res) => res.render('chat/interface', { sessionId: req.params.sessionId }));
router.post('/:sessionId', chatController.handleChat);
router.post('/:sessionId/end', chatController.endChat);

export default router;