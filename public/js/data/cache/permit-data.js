export const Permit = {
  baseUrl: "/api/permits",

  async add(data) {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  async getAll() {
    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error("Failed to fetch permits");
    return await res.json();
  },

  async getById(id) {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  async update(id, data) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  async delete(id) {
    const res = await fetch(`${this.baseUrl}/${id}`, { method: "DELETE" });
    if (!res.ok) throw await res.json();
    return await res.json();
  }
};
