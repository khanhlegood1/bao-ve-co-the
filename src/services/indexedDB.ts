export interface UserProfile {
  id?: number;
  uuid: string;
  anonymousId: string;
  username: string;
  email: string | null;
  avatar: string | null;
  selectedOrgan: string; // "Heart" | "Liver" | "Lungs" | "Kidneys" | "Stomach"
  referrerUuid: string | null;
  isSyncedToBlockchain: boolean;
  gameProgress: {
    level: number;
    score: number;
    completedQuests: string[];
    lastUpdated: number;
  };
}

const DB_NAME = "BaoVeCoThe_DB";
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("users")) {
        const store = db.createObjectStore("users", { keyPath: "uuid" });
        store.createIndex("anonymousId", "anonymousId", { unique: true });
        store.createIndex("email", "email", { unique: false });
      }
    };
  });
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("users", "readwrite");
    const store = transaction.objectStore("users");
    const request = store.put(profile);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getUserProfile = async (uuid: string): Promise<UserProfile | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("users", "readonly");
    const store = transaction.objectStore("users");
    const request = store.get(uuid);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getLocalUserByAnonymousId = async (anonId: string): Promise<UserProfile | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("users", "readonly");
    const store = transaction.objectStore("users");
    const index = store.index("anonymousId");
    const request = index.get(anonId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};