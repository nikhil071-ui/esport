const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteCollection(collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function clearDatabase() {
  console.log("Starting database cleanup...");

  try {
    // 1. Delete Tournaments
    console.log("Deleting 'tournaments' collection...");
    await deleteCollection('tournaments', 100);
    console.log("✅ Tournaments deleted.");

    // 2. Delete Users (Optional: Comment out if you want to keep users)
    console.log("Deleting 'users' collection...");
    await deleteCollection('users', 100);
    console.log("✅ Users deleted.");
    
    // 3. Delete other collections if any (e.g., specific transaction logs if separate)
    // Add here if needed

    console.log("🎉 Database cleared successfully!");
  } catch (error) {
    console.error("Error clearing database:", error);
  } finally {
    process.exit();
  }
}

clearDatabase();
