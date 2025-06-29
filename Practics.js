import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';
import fs from 'fs'; // For saving the report to a file
import mongoose from 'mongoose';
import Report from './models/Report.js';

// Initialize MongoDB (add right after GoogleGenAI initialization)
mongoose.connect('mongodb://localhost:27017/medical_reports');
let currentPatientId = null;


const ai = new GoogleGenAI({ apiKey: "AIzaSyA9HF0Q-EHCVhudJ4eIfCEQ7SI3oXxWvNU" });
const History = [];

async function Chating(userinput) {


if (userinput.trim().toLowerCase() === 'exit' || userinput.trim() === 'quit') {
  const reportData = generateConciseMedicalReport(); // Get the generated report
  await saveToMongoDB(reportData); // Save to MongoDB
  process.exit(0);
}

  History.push({
    role: 'user',
    parts: [{ text: userinput }]
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: History,
    config: {
      systemInstruction: `You are a doctor and your name is Dr. Cupper. You are here to take the first basic information from a patient. Your tone should be professional, empathetic, and clear. Ask concise questions to gather essential details such as:  
  1. **Patient's name and age**  
  2. **Chief complaint** (main reason for the visit)  
  3. **Duration of symptoms**  
  4. **Severity** (e.g., mild/moderate/severe pain)  
  5. **Any existing medical conditions or allergies**  
  6. **Current medications**  
  7. **Other relevant history** (e.g., recent travel, surgeries)  
Avoid diagnosing or offering treatment—just collect information. If the patient asks medical advice, politely defer to an in-person consultation.`, // Your existing instruction
    },
  });

  History.push({
    role: "model",
    parts: [{ text: response.text }]
  });

  console.log(response.text);
  main(); // Continue the loop
}


// mongodb me save krne ke liye or render krne ke liye 
async function saveToMongoDB(reportText) {
  try {
    const report = new Report({
      patientId: currentPatientId || `pat_${Date.now()}`,
      reportText: reportText,
      conversation: History,
      createdAt: new Date()
    });
    await report.save();
    console.log(`Report saved to MongoDB with ID: ${report.patientId}`);
    console.log(`Access full report at: http://localhost:3000/reports/${report.patientId}`);
  } catch (err) {
    console.error('Error saving to MongoDB:', err);
  }
}


// Generate and save the report
function generateConciseMedicalReport() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `PreVisit_Summary_${timestamp}.txt`;

  let report = "=== ESSENTIAL PRE-VISIT SUMMARY ===\n\n";
  report += `Patient: [Name]\nDate: ${new Date().toLocaleDateString()}\n\n`;
  report += "────────────────────────────────────\n\n";

  // Medical focus areas
  const medicalKeywords = [
    'pain', 'symptom', 'hurt', 'feel', 'experience', 'diagnos', 
    'medic', 'drug', 'allerg', 'blood', 'test', 'result', 
    'treat', 'therap', 'surger', 'hospital', 'history', 
    'family history', 'smok', 'alcohol', 'exercise', 'diet',
    'sleep', 'stress', 'weight', 'bowel', 'urinar', 'sexual',
    'vision', 'hear', 'breath', 'cough', 'fever', 'rash'
  ];

  let activeConcerns = [];
  let medicalHistory = [];
  let medications = [];
  let symptoms = [];
  let lifestyleFactors = [];

  History.forEach((entry) => {
    const text = entry.parts[0].text.toLowerCase();
    
    // Only include medically relevant statements
    if (medicalKeywords.some(keyword => text.includes(keyword))) {
      const cleanText = entry.parts[0].text.replace(/\b(I|my|me)\b/gi, '').trim();
      
      if (entry.role === 'user') {
        if (text.includes('medic') || text.includes('drug')) {
          medications.push(`• ${cleanText}`);
        } 
        else if (text.includes('history') && !text.includes('family')) {
          medicalHistory.push(`• ${cleanText}`);
        }
        else if (text.includes('family history')) {
          medicalHistory.push(`• Family History: ${cleanText.replace('family history', '')}`);
        }
        else if (text.includes('symptom') || text.includes('pain') || text.includes('feel')) {
          symptoms.push(`• ${cleanText}`);
        }
        else if (text.includes('smok') || text.includes('alcohol') || text.includes('exercise') || text.includes('diet')) {
          lifestyleFactors.push(`• ${cleanText}`);
        }
        else {
          activeConcerns.push(`• ${cleanText}`);
        }
      }
      else { // Doctor/system responses
        // Only include clinically significant provider notes
        if (text.includes('recommend') || text.includes('suggest') || 
            text.includes('concern') || text.includes('risk') ||
            text.includes('need') || text.includes('should')) {
          medicalHistory.push(`- [CLINICIAN NOTE] ${entry.parts[0].text}`);
        }
      }
    }
  });

  // Build report sections only if they contain data
  if (activeConcerns.length > 0) {
    report += "PRIMARY CONCERNS:\n" + activeConcerns.join('\n') + "\n\n";
  }

  if (symptoms.length > 0) {
    report += "SYMPTOMS:\n" + symptoms.join('\n') + "\n\n";
  }

  if (medicalHistory.length > 0) {
    report += "RELEVANT HISTORY:\n" + medicalHistory.join('\n') + "\n\n";
  }

  if (medications.length > 0) {
    report += "MEDICATIONS/ALLERGIES:\n" + medications.join('\n') + "\n\n";
  }

  if (lifestyleFactors.length > 0) {
    report += "LIFESTYLE FACTORS:\n" + lifestyleFactors.join('\n') + "\n\n";
  }

  report += "────────────────────────────────────\n";
  report += "END OF ESSENTIAL SUMMARY";

  fs.writeFileSync(filename, report);
  console.log(`\nClinical pre-visit summary saved as ${filename}`);
}

async function main() {
  const userinput = readlineSync.question("Dr.Cupper2-->");
  await Chating(userinput);
}

main();