import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDoc,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { Lead, ConsignmentOrder, BusinessSettings, LeadStatus, AdminUser, MediaItem } from '../types';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore instances
export const defaultDb = getFirestore(app);
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : defaultDb;

// Helper to remove any undefined fields before writing to Firestore
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result as Partial<T>;
}

// Normalizer to convert any Firestore document format into a typed Lead safely
export function normalizeFirestoreLead(docId: string, data: any): Lead {
  if (!data) {
    return {
      id: docId,
      protocol: `ROM-${docId.slice(-6).toUpperCase()}`,
      fullName: 'Revendedora',
      cpf: '',
      birthDate: '',
      phone: '',
      city: 'Itapema',
      hasExperience: 'nao',
      wantsFavorita40: 'sim',
      termsAccepted: true,
      consentLgpd: true,
      consentTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'novo',
      score: 'medio',
      notes: [],
    };
  }

  let createdAtStr = new Date().toISOString();
  if (data.createdAt) {
    if (typeof data.createdAt === 'string') {
      createdAtStr = data.createdAt;
    } else if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
      createdAtStr = data.createdAt.toDate().toISOString();
    } else if (data.createdAt.seconds) {
      createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString();
    }
  } else if (data.timestamp) {
    if (typeof data.timestamp === 'string') {
      createdAtStr = data.timestamp;
    } else if (data.timestamp.toDate && typeof data.timestamp.toDate === 'function') {
      createdAtStr = data.timestamp.toDate().toISOString();
    } else if (data.timestamp.seconds) {
      createdAtStr = new Date(data.timestamp.seconds * 1000).toISOString();
    }
  } else if (data.dataCadastro || data.data_cadastro) {
    const d = data.dataCadastro || data.data_cadastro;
    if (typeof d === 'string') createdAtStr = d;
    else if (d?.toDate) createdAtStr = d.toDate().toISOString();
  }

  const fullName = data.fullName || data.nomeCompleto || data.nome || data.name || 'Revendedora';
  const cpf = data.cpf || data.documento || data.cpfFormatado || '';
  const phone = data.phone || data.telefone || data.whatsapp || data.celular || '';
  const city = data.city || data.cidade || data.municipio || 'Itapema';
  const birthDate = data.birthDate || data.dataNascimento || data.nascimento || '';
  const protocol = data.protocol || data.protocolo || `ROM-${docId.slice(-6).toUpperCase()}`;
  const status = data.status || 'novo';
  const score = data.score || (data.wantsFavorita40 === 'sim' || data.wantsFavorita === true ? 'alto' : 'medio');
  const hasExperience = data.hasExperience || data.experiencia || 'nao';
  const wantsFavorita40 = data.wantsFavorita40 || (data.wantsFavorita === true || data.favorita === 'sim' ? 'sim' : 'nao');
  const notes = Array.isArray(data.notes) ? data.notes : [];

  return {
    id: docId,
    protocol,
    fullName,
    cpf,
    birthDate,
    age: data.age || undefined,
    phone,
    city,
    neighborhood: data.neighborhood || data.bairro || data.address || data.endereco || undefined,
    hasExperience,
    wantsFavorita40,
    termsAccepted: data.termsAccepted ?? true,
    consentLgpd: data.consentLgpd ?? true,
    consentTimestamp: data.consentTimestamp || createdAtStr,
    createdAt: createdAtStr,
    status,
    score,
    notes,
    source: data.source || data.origem || undefined,
  };
}

// Test connectivity on initial load
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'business_config'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
    }
    return false;
  }
}

// Collection References
export const LEADS_COLLECTION = 'leads';
export const ORDERS_COLLECTION = 'orders';
export const SETTINGS_COLLECTION = 'settings';
export const SETTINGS_DOC_ID = 'business_config';
export const ADMIN_USERS_COLLECTION = 'admin_users';
export const MEDIA_ITEMS_COLLECTION = 'media_items';

// Alternative collections to scan for leads if created externally
const ALTERNATIVE_LEAD_COLLECTIONS = ['leads', 'pre_cadastros', 'cadastros', 'revendedoras', 'contatos'];

// Helper to sort items by createdAt descending safely
function sortByCreatedAtDesc<T extends { createdAt?: string | any }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

// ----------------------------------------------------
// REALTIME SUBSCRIPTIONS
// ----------------------------------------------------

export function subscribeToLeads(
  onUpdate: (leads: Lead[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const colRef = collection(db, LEADS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Lead[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeFirestoreLead(docSnap.id, docSnap.data()));
        });
        const sorted = sortByCreatedAtDesc(list);
        onUpdate(sorted);
      },
      (error) => {
        console.warn('Firestore leads subscription error (using local cache):', error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn('Error setting up leads subscription:', err);
    return () => {};
  }
}

export async function fetchLeadsFromFirestore(): Promise<Lead[]> {
  const leadMap = new Map<string, Lead>();
  const databasesToTry = [db];
  if (defaultDb !== db) {
    databasesToTry.push(defaultDb);
  }

  for (const currentDb of databasesToTry) {
    for (const colName of ALTERNATIVE_LEAD_COLLECTIONS) {
      try {
        const colRef = collection(currentDb, colName);
        const snap = await getDocs(colRef);
        snap.forEach((docSnap) => {
          if (!leadMap.has(docSnap.id)) {
            leadMap.set(docSnap.id, normalizeFirestoreLead(docSnap.id, docSnap.data()));
          }
        });
      } catch (err) {
        // Continue to other collections silently
      }
    }
  }

  const list = Array.from(leadMap.values());
  return sortByCreatedAtDesc(list);
}

export function subscribeToOrders(
  onUpdate: (orders: ConsignmentOrder[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: ConsignmentOrder[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as ConsignmentOrder);
        });
        list.sort((a, b) => {
          const timeA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
          const timeB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
          return timeB - timeA;
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore orders subscription error (using local cache):', error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn('Error setting up orders subscription:', err);
    return () => {};
  }
}

export async function fetchOrdersFromFirestore(): Promise<ConsignmentOrder[]> {
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    const snap = await getDocs(colRef);
    const list: ConsignmentOrder[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as ConsignmentOrder);
    });
    return list;
  } catch (err) {
    console.error('Error fetching orders from Firestore:', err);
    throw err;
  }
}

export function subscribeToSettings(
  onUpdate: (settings: BusinessSettings) => void,
  onError?: (err: Error) => void
) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as BusinessSettings);
        }
      },
      (error) => {
        console.warn('Firestore settings subscription error (using local cache):', error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn('Error setting up settings subscription:', err);
    return () => {};
  }
}

export function subscribeToAdminUsers(
  onUpdate: (users: AdminUser[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, ADMIN_USERS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: AdminUser[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as AdminUser);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore admin users subscription error (using local cache):', error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn('Error setting up admin users subscription:', err);
    return () => {};
  }
}

export function subscribeToMediaItems(
  onUpdate: (items: MediaItem[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, MEDIA_ITEMS_COLLECTION), orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: MediaItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as MediaItem);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore media items subscription error (using local cache):', error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn('Error setting up media items subscription:', err);
    return () => {};
  }
}

// ----------------------------------------------------
// FIRESTORE CRUD OPERATIONS
// ----------------------------------------------------

export async function saveLeadToFirestore(lead: Lead): Promise<void> {
  try {
    const docRef = doc(db, LEADS_COLLECTION, lead.id);
    const sanitized = sanitizeForFirestore(lead);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (e) {
    console.error('Error saving lead to Firestore:', e);
    throw e;
  }
}

export async function updateLeadStatusInFirestore(leadId: string, status: LeadStatus): Promise<void> {
  try {
    const docRef = doc(db, LEADS_COLLECTION, leadId);
    await updateDoc(docRef, { status });
  } catch (e) {
    console.error('Error updating lead status in Firestore:', e);
    throw e;
  }
}

export async function addLeadNoteInFirestore(leadId: string, note: Lead['notes'][0]): Promise<void> {
  try {
    const docRef = doc(db, LEADS_COLLECTION, leadId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Lead;
      const notes = [sanitizeForFirestore(note), ...(data.notes || [])];
      await updateDoc(docRef, { notes });
    }
  } catch (e) {
    console.error('Error adding lead note in Firestore:', e);
    throw e;
  }
}

export async function deleteLeadFromFirestore(leadId: string): Promise<void> {
  try {
    const docRef = doc(db, LEADS_COLLECTION, leadId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('Error deleting lead from Firestore:', e);
    throw e;
  }
}

export async function saveOrderToFirestore(order: ConsignmentOrder): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    const sanitized = sanitizeForFirestore(order);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (e) {
    console.error('Error saving order to Firestore:', e);
    throw e;
  }
}

export async function saveSettingsToFirestore(settings: BusinessSettings): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const sanitized = sanitizeForFirestore(settings);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (e) {
    console.error('Error saving settings to Firestore:', e);
    throw e;
  }
}

export async function saveAdminUserToFirestore(user: AdminUser): Promise<void> {
  try {
    const docRef = doc(db, ADMIN_USERS_COLLECTION, user.id);
    const sanitized = sanitizeForFirestore(user);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (e) {
    console.error('Error saving admin user to Firestore:', e);
    throw e;
  }
}

export async function deleteAdminUserFromFirestore(userId: string): Promise<void> {
  try {
    const docRef = doc(db, ADMIN_USERS_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('Error deleting admin user from Firestore:', e);
    throw e;
  }
}

export async function saveMediaItemToFirestore(item: MediaItem): Promise<void> {
  try {
    const docRef = doc(db, MEDIA_ITEMS_COLLECTION, item.id);
    const sanitized = sanitizeForFirestore(item);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (e) {
    console.error('Error saving media item to Firestore:', e);
    throw e;
  }
}

export async function deleteMediaItemFromFirestore(itemId: string): Promise<void> {
  try {
    const docRef = doc(db, MEDIA_ITEMS_COLLECTION, itemId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('Error deleting media item from Firestore:', e);
    throw e;
  }
}

