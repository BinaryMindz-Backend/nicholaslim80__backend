import * as admin from 'firebase-admin';

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT is missing in .env");
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),

});

export default admin;
// console.log('Firebase SA check:', {
//   type: serviceAccount.type,
//   project_id: serviceAccount.project_id,
//   client_email: serviceAccount.client_email,
//   private_key_starts: serviceAccount.private_key?.slice(0, 40),
// });