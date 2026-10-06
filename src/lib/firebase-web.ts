// Public web configuration of the Firebase project. These are identifiers, not secrets: they
// always end up in the browser. What protects the data is that the browser never talks to
// Firestore (only the server does, with its service account) and that the server verifies the
// login token and ADMIN_UID on every admin operation.
const firebaseConfig = {
  apiKey: "AIzaSyAsxG_dMzaWCbdNQf26klDTVTf0XC7SLl4",
  authDomain: "linha-digital.firebaseapp.com",
  projectId: "linha-digital",
  appId: "1:950129106627:web:bf8e454c3960d093324c76",
};

/** Loads Firebase Authentication on demand (browser only), so other pages never ship it. */
export async function carregarAuth() {
  const [{ getApps, initializeApp }, authModule] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
  ]);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return { auth: authModule.getAuth(app), ...authModule };
}
