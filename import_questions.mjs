import fs from 'fs';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDRG1ymUUpNR5wIs9Oxu64okfBndIAvFko",
    authDomain: "hawdaj-kids-71c91.firebaseapp.com",
    projectId: "hawdaj-kids-71c91",
    storageBucket: "hawdaj-kids-71c91.firebasestorage.app",
    messagingSenderId: "842981532941",
    appId: "1:842981532941:web:1ef4c7e68862c0e2547c44",
    databaseURL: "https://hawdaj-kids-71c91-default-rtdb.firebaseio.com",
    measurementId: "G-YKNCZEF5LZ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const text = fs.readFileSync('questions.txt', 'utf8');
const blocks = text.split(/<\/p><p>|<p>|<\/p>/).map(s => s.trim()).filter(Boolean);

const questions = [];
let currentQuestionText = null;

for (let i = 0; i < blocks.length; i++) {
    const line = blocks[i];
    
    if (/^\d+[\.\-]\s+/.test(line) || /^\d+[\.\-]/.test(line)) {
        currentQuestionText = line.replace(/^\d+[\.\-]\s*/, '').trim();
    } else if (line.includes('أ)') && line.includes('ب)') && line.includes('ج)')) {
        if (!currentQuestionText) continue;
        
        let correctIndex = 0;
        let options = line.split('|').map(s => s.trim());
        
        const cleanOptions = [];
        options.forEach((opt, idx) => {
            if (opt.includes('#')) {
                correctIndex = idx;
            }
            let cleanText = opt.replace(/^[أ-ي]\)\s*/, '').replace('#', '').trim();
            cleanOptions.push(cleanText);
        });
        
        questions.push({
            id: 'q_import_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
            question: currentQuestionText,
            options: cleanOptions,
            correct: correctIndex,
            hint: 'فكر جيداً',
            image: ''
        });
        currentQuestionText = null;
    }
}

console.log(`Parsed ${questions.length} questions successfully!`);

const dbRef = ref(db, 'global_game_data/quizGeneral');
set(dbRef, questions).then(() => {
    console.log(`Successfully pushed to Firebase. Total questions: ${questions.length}`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});

