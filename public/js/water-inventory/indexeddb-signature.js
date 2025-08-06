const dbName = "WaterInventoryDB";
const storeName = "signatures";

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject("Failed to open IndexedDB");
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

export async function saveSignatureToIndexedDB(signatureDataURL, id) {
  const db = await openIndexedDB();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const data = { id, signature: signatureDataURL };
  await store.put(data);
  return tx.complete;
}

export async function getSignatureFromIndexedDB(id) {
  const db = await openIndexedDB();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  return await new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result?.signature || null);
    request.onerror = () => reject("Error getting signature");
  });
}
