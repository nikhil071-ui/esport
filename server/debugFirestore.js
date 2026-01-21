const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function debugStats() {
    console.log("🔍 Debugging Match Stats Collection...");
    try {
        const snapshot = await admin.firestore().collection('match_stats').get();
        if (snapshot.empty) {
            console.log("❌ Collection 'match_stats' is EMPTY.");
        } else {
            console.log(`✅ Found ${snapshot.size} documents.`);
            snapshot.docs.slice(0, 3).forEach(doc => {
                console.log("Sample Doc:", doc.data());
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

debugStats();
