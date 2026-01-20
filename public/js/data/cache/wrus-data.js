export const WUSData = {
  baseUrl: "/api/wus",
  localStorageKey: "cachedWUS",

  // --------------------------
  // FETCH ALL
  // --------------------------
  async fetchAll() {
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) return JSON.parse(cached);

    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error("Failed to fetch WUS data");

    const data = await res.json();

    // 🔒 normalize: ensure _id is always string
    const normalized = data.map(d => ({
      ...d,
      _id: d._id?.toString()
    }));

    localStorage.setItem(this.localStorageKey, JSON.stringify(normalized));
    return normalized.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // --------------------------
  // FORCE REFRESH CACHE
  // --------------------------
  async refreshCache() {
    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error("Failed to refresh WUS cache");

    const data = await res.json();
    const normalized = data.map(d => ({
      ...d,
      _id: d._id?.toString()
    }));

    localStorage.setItem(this.localStorageKey, JSON.stringify(normalized));
    return normalized;
  },

  // --------------------------
  // ADD (NO _id REQUIRED)
  // --------------------------
  async add(payload) {
    // 🚫 Prevent client from sending _id or Firestore id
    const { _id, id, ...safePayload } = payload;

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safePayload)
    });

    if (!res.ok) throw await res.json();

    const newEntry = await res.json();
    newEntry._id = newEntry._id.toString();

    const cached = JSON.parse(localStorage.getItem(this.localStorageKey) || "[]");
    cached.unshift(newEntry);
    localStorage.setItem(this.localStorageKey, JSON.stringify(cached));

    return newEntry;
  },

  // --------------------------
  // UPDATE (Mongo _id ONLY)
  // --------------------------
  async update(_id, payload) {
    if (!_id) throw new Error("MongoDB _id is required");

    // 🚫 Never send _id or firestore id in body
    const { _id: ignore1, id: ignore2, ...safePayload } = payload;

    const res = await fetch(`${this.baseUrl}/${_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safePayload)
    });

    if (!res.ok) throw await res.json();

    const updated = await res.json();
    updated._id = updated._id.toString();

    const cached = JSON.parse(localStorage.getItem(this.localStorageKey) || "[]");
    const index = cached.findIndex(e => e._id === _id);
    if (index !== -1) cached[index] = updated;

    localStorage.setItem(this.localStorageKey, JSON.stringify(cached));
    return updated;
  },

  // --------------------------
  // DELETE (Mongo _id ONLY)
  // --------------------------
  async delete(_id) {
    if (!_id) throw new Error("MongoDB _id is required");

    const res = await fetch(`${this.baseUrl}/${_id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw await res.json();

    const cached = JSON.parse(localStorage.getItem(this.localStorageKey) || "[]");
    localStorage.setItem(
      this.localStorageKey,
      JSON.stringify(cached.filter(e => e._id !== _id))
    );

    return { success: true };
  },

  // --------------------------
  // AUTO REFRESH (DAILY)
  // --------------------------
  async autoRefreshDaily() {
    const dateKey = `${this.localStorageKey}_lastRefreshDate`;
    const today = new Date().toISOString().split("T")[0];

    if (localStorage.getItem(dateKey) !== today) {
      await this.refreshCache();
      localStorage.setItem(dateKey, today);
      console.log("[WUS] Cache auto-refreshed (daily)");
    }
  },

  // --------------------------
  // AUTO REFRESH (8 HOURS)
  // --------------------------
  async autoRefreshEvery8Hours() {
    const key = `${this.localStorageKey}_lastRefresh`;
    const now = Date.now();
    const last = localStorage.getItem(key);

    if (!last || now - Number(last) > 8 * 60 * 60 * 1000) {
      await this.refreshCache();
      localStorage.setItem(key, now.toString());
      console.log("[WUS] Cache refreshed (8-hour interval)");
    }
  }
};
