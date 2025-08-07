export class SignatureDB {
  constructor(dbName = "WaterInventoryDB", storeName = "signatures") {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = this.#openDB();
  }

  async #openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject("Failed to open IndexedDB");

      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }

  async #getStore(mode = "readonly") {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, mode);
    return tx.objectStore(this.storeName);
  }

  async saveSignature(signatureDataURL, id) {
    const store = await this.#getStore("readwrite");
    const request = store.put({ id, signature: signatureDataURL });

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject("Failed to save signature");
    });
  }

  async getSignature(id) {
    const store = await this.#getStore("readonly");
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.signature || null);
      request.onerror = () => reject("Error getting signature");
    });
  }

  async clearSignatures() {
    const store = await this.#getStore("readwrite");
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject("Failed to clear signatures");
    });
  }

  async deleteSignature(id) {
    const store = await this.#getStore("readwrite");
    const request = store.delete(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject("Failed to delete signature");
    });
  }
}
