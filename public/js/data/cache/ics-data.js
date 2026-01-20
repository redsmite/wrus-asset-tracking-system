export const ICS = {
  baseUrl: "/api/ics",
  localStorageKey: "cachedICS",

  async fetchAll() {
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) return JSON.parse(cached).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error("Failed to fetch ICS data");
    const data = await res.json();
    localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    return data;
  },

  async add(data) {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await res.json();
    const newEntry = await res.json();

    const cached = JSON.parse(localStorage.getItem(this.localStorageKey) || "[]");
    cached.push(newEntry);
    localStorage.setItem(this.localStorageKey, JSON.stringify(cached));

    return newEntry;
  },

  async update(id, data) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await res.json();
    const updated = await res.json();

    const cached = JSON.parse(localStorage.getItem(this.localStorageKey) || "[]");
    const index = cached.findIndex(e => e._id === id);
    if (index !== -1) cached[index] = updated;
    localStorage.setItem(this.localStorageKey, JSON.stringify(cached));

    return updated;
  },

  async delete(id) {
    const res = await fetch(`${this.baseUrl}/${id}`, { method: "DELETE" });
    if (!res.ok) throw await res.json();

    const cached = JSON.parse(localStorage.getItem(this.localStorageKey) || "[]");
    localStorage.setItem(this.localStorageKey, JSON.stringify(cached.filter(e => e._id !== id)));

    return { success: true };
  },

  async getICSDataByUserId(userId) {
    const res = await fetch(`${this.baseUrl}/user/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch ICS for user");
    return await res.json();
  },

  async refreshCache() {
    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error("Failed to refresh ICS cache");
    const data = await res.json();
    localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    return data;
  },

  async autoRefreshDaily() {
    const dateKey = `${this.localStorageKey}_lastRefreshDate`;
    const today = new Date().toISOString().split("T")[0];
    const lastRefresh = localStorage.getItem(dateKey);

    if (lastRefresh !== today) {
      await this.refreshCache();
      localStorage.setItem(dateKey, today);
      console.log("[ICS] Cache auto-refreshed for the day.");
    }
  },

  async autoRefreshEvery8Hours() {
    const key = `${this.localStorageKey}_lastRefresh`;
    const now = Date.now();
    const last = localStorage.getItem(key);

    if (!last || now - parseInt(last, 10) > 8 * 60 * 60 * 1000) {
      await this.refreshCache();
      localStorage.setItem(key, now.toString());
      console.log("[ICS] Cache refreshed (8-hour interval).");
    }
  }
};
