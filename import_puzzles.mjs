import fs from 'fs';
import path from 'path';
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

const folderPath = 'صور البازل';
const files = fs.readdirSync(folderPath);

const puzzles = [];

for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) continue;

    // Name = filename without extension
    const name = path.basename(file, ext).trim();
    
    const filePath = path.join(folderPath, file);
    const fileData = fs.readFileSync(filePath);
    const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const base64 = `data:${mimeType};base64,` + fileData.toString('base64');

    puzzles.push({
        id: 'p_import_' + Date.now() + '_' + Math.floor(Math.random() * 99999),
        name,
        image: base64
    });

    console.log(`✅ Loaded: ${name} (${(fileData.length / 1024).toFixed(0)} KB)`);
}

console.log(`\nTotal puzzles to upload: ${puzzles.length}`);
console.log('Uploading to Firebase...');

const dbRef = ref(db, 'global_game_data/puzzles');
set(dbRef, puzzles).then(() => {
    console.log(`\n🎉 Done! Total puzzles in Firebase: ${puzzles.length}`);
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
