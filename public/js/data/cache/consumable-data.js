export const Consumable = {
  async fetchAll() {
    const res = await fetch("http://localhost:3000/api/consumable");
    return await res.json();
  },

  async add(spec, qty, unit, addedBy, remarks) {
    const res = await fetch("http://localhost:3000/api/consumable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specification: spec, qty, unit, addedBy, remarks }),
    });
    return await res.json();
  },

  async getById(id) {
    const res = await fetch(`http://localhost:3000/api/consumable/${id}`);
    return await res.json();
  },

  async update(id, updatedData) {
    const res = await fetch(`http://localhost:3000/api/consumable/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    return await res.json();
  },

  async delete(id) {
    const res = await fetch(`http://localhost:3000/api/consumable/${id}`, { method: "DELETE" });
    return await res.json();
  }
};
