import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';

interface FirebaseAppletConfig extends FirebaseOptions {
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

// Optional compile-safe load: resolves automatically when firebase-applet-config.json exists
// locally in AI Studio, and evaluates to {} without TS2307 when omitted in GitHub exports.
const appletConfigModules = import.meta.glob<{
  default?: Partial<FirebaseAppletConfig>;
}>('../firebase-applet-config.json', { eager: true });

const fileConfig: Partial<FirebaseAppletConfig> =
  Object.values(appletConfigModules)[0]?.default ?? {};

// Extracted public Web SDK configuration of the active SAAED Firebase project (lucid-codex-5mn89).
// Note: Firebase client SDK keys/IDs are public identifiers protected by Firestore Security Rules
// and Firebase Auth Authorized Domains, not server secrets.
const PROJECT_FIREBASE_CONFIG: FirebaseAppletConfig = {
  projectId: 'lucid-codex-5mn89',
  appId: '1:235606431854:web:1a2e0416be7a38e0c5ee7f',
  apiKey: 'AIzaSyDq9I2cD4ukTXl2b4tjwWw6blnH2P_JxUQ',
  authDomain: 'lucid-codex-5mn89.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-1654b67b-3f58-42f9-b891-6aa8812cff6a',
  storageBucket: 'lucid-codex-5mn89.firebasestorage.app',
  messagingSenderId: '235606431854',
  measurementId: '',
  oAuthClientId:
    '235606431854-e7fd4c8un4kjld27bq830vhgrk3g1uui.apps.googleusercontent.com',
  recaptchaSiteKey: '',
};

function pickConfigValue(
  envValue: string | undefined,
  fileValue: string | undefined,
  fallbackValue: string
): string {
  const cleanEnv = typeof envValue === 'string' ? envValue.trim() : '';
  if (cleanEnv.length > 0) return cleanEnv;
  const cleanFile = typeof fileValue === 'string' ? fileValue.trim() : '';
  if (cleanFile.length > 0) return cleanFile;
  return fallbackValue;
}

const resolvedMeasurementId = pickConfigValue(
  import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  fileConfig.measurementId,
  PROJECT_FIREBASE_CONFIG.measurementId || ''
);

const firebaseConfig: FirebaseAppletConfig = {
  apiKey: pickConfigValue(
    import.meta.env.VITE_FIREBASE_API_KEY,
    fileConfig.apiKey,
    PROJECT_FIREBASE_CONFIG.apiKey || ''
  ),
  authDomain: pickConfigValue(
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    fileConfig.authDomain,
    PROJECT_FIREBASE_CONFIG.authDomain || ''
  ),
  projectId: pickConfigValue(
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
    fileConfig.projectId,
    PROJECT_FIREBASE_CONFIG.projectId || ''
  ),
  storageBucket: pickConfigValue(
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    fileConfig.storageBucket,
    PROJECT_FIREBASE_CONFIG.storageBucket || ''
  ),
  messagingSenderId: pickConfigValue(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    fileConfig.messagingSenderId,
    PROJECT_FIREBASE_CONFIG.messagingSenderId || ''
  ),
  appId: pickConfigValue(
    import.meta.env.VITE_FIREBASE_APP_ID,
    fileConfig.appId,
    PROJECT_FIREBASE_CONFIG.appId || ''
  ),
  firestoreDatabaseId: pickConfigValue(
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
    fileConfig.firestoreDatabaseId,
    PROJECT_FIREBASE_CONFIG.firestoreDatabaseId || ''
  ),
  ...(resolvedMeasurementId ? { measurementId: resolvedMeasurementId } : {}),
};

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}
