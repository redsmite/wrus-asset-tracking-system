export const Users = {
  baseUrl: "/api/users",

  async add(data) {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  async fetchAllDesc() {
    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error("Failed to fetch users");
    const users = await res.json();
    return users.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async fetchAllAsc() {
    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error("Failed to fetch users");
    const users = await res.json();
    return users.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  async getUsersMap() {
    const users = await this.fetchAllAsc();
    const map = {};
    users.forEach(u => map[u._id] = `${u.lastName}, ${u.firstName} ${u.middleInitial || ''}`.trim());
    return map;
  },

  async fetchUsersSummary() {
    const users = await this.fetchAllAsc();
    return users
      .filter(u => u.username?.toLowerCase() !== "admin")
      .map(u => ({
        _id: u._id,
        username: u.username || '',
        lastName: u.lastName || '',
        firstName: u.firstName || '',
        middleInitial: u.middleInitial || '',
        type: u.type || '',
        status: u.status || ''
      }));
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
