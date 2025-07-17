import { WUSData } from "../wrus/wrus-data.js";

(async () => {
  try {
    const allDocs = await WUSData.fetchAll();

    for (const doc of allDocs) {
      if (doc.city?.trim().toLowerCase() === 'quezon') {
        await WUSData.update(doc.id, { city: 'Quezon City' });
        console.log(`✅ Updated ${doc.id} (Quezon → Quezon City)`);
      }
    }

    console.log('🎉 Done updating city names!');
    console.log('📦 Final data:', WUSData._data);
  } catch (err) {
    console.error('❌ Error during update:', err);
  }
})();
