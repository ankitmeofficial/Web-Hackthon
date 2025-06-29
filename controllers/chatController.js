import Report from '../models/Report.js';
import { generateAIResponse } from '../services/aiService.js';
import { generateMedicalReport } from './reportController.js';


const chatSessions = new Map(); // In-memory store for active chats

// yaha se chats start hoga  
export default {
  async startNewChat(req, res) {
    const sessionId = Date.now().toString();
    chatSessions.set(sessionId, {
      history: [],
      patientName: 'New Patient'
    });
    res.redirect(`/${sessionId}`); 
  },

  async handleChat(req, res) {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    const session = chatSessions.get(sessionId);
    if (!session) return res.redirect('/');

    // Add patient message
    session.history.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Get AI response
    const aiResponse = await generateAIResponse(session.history);
    
    // Add AI response
    session.history.push({
      role: 'model',
      parts: [{ text: aiResponse }]
    });

    res.json({ response: aiResponse, sessionId });
  },

  async endChat(req, res) {
    const { sessionId } = req.params;
    const session = chatSessions.get(sessionId);
    if (!session) return res.redirect('/');

    // Extract patient name from conversation
    let patientName = 'Unknown Patient';
    for (const message of session.history) {
      if (message.role === 'user') {
        const text = message.parts[0].text.toLowerCase();
        
        // Multiple patterns for name extraction
        const namePatterns = [
          /(?:my name is|i am|call me|this is)\s+([a-zA-Z\s]+)/,
          /(?:name|called)\s+([a-zA-Z\s]+)/,
          /^([a-zA-Z\s]+)\s+(?:here|speaking)/
        ];
        
        for (const pattern of namePatterns) {
          const nameMatch = text.match(pattern);
          if (nameMatch && nameMatch[1].trim().length > 0) {
            patientName = nameMatch[1].trim();
            break;
          }
        }
        
        if (patientName !== 'Unknown Patient') break;
      }
    }

    // Generate and save report
    const report = await generateMedicalReport(session.history);
    const savedReport = await Report.create({
      patientId: `pat_${sessionId}`,
      patientName: patientName,
      reportText: report,
      conversation: session.history
    });

    // Clean up session
    chatSessions.delete(sessionId);

    res.redirect(`/reports/${savedReport.patientId}`);
  }
};

