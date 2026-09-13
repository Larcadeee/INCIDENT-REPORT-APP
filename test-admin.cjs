const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp({ projectId: config.projectId });
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const snapshot = await db.collection('incidents').limit(1).get();
    console.log('Success, docs:', snapshot.docs.length);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
