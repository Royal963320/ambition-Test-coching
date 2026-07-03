import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification, updateProfile } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDTH_Rl5fbhVngGa3mIGF5Sr06xwfBVnCk",
  authDomain: "computer-coaching-test.firebaseapp.com",
  projectId: "computer-coaching-test",
  storageBucket: "computer-coaching-test.firebasestorage.app",
  messagingSenderId: "1055262911384",
  appId: "1:1055262911384:web:15864ec62f2c0e979e19ed",
  firestoreDatabaseId: "(default)",
};


// Verify if the critical fields are configured
export const isFirebaseConfigured = !!(
  firebaseConfig.projectId && 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID"
);

let app;
let db: any = null;
let auth: any = null;
const googleProvider = new GoogleAuthProvider();

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully! 🔥");
  } catch (error) {
    console.error("Failed to initialize Firebase app:", error);
  }
} else {
  console.log("Firebase credentials not configured yet. Operating in Local Storage mode. 💾");
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { db, auth, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification, updateProfile };
