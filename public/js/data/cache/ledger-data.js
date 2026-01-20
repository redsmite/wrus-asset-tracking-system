export const Ledger = {
  async fetchAll() {
    const res = await fetch("http://localhost:3000/api/ledger");
    return await res.json();
  },

  async addEntry(entry) {
    const res = await fetch("http://localhost:3000/api/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    return await res.json();
  },

  async getEntriesByCID(cid) {
    const res = await fetch(`http://localhost:3000/api/ledger/cid/${cid}`);
    return await res.json();
  },

  async deleteEntry(id) {
    const res = await fetch(`http://localhost:3000/api/ledger/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  }
};
