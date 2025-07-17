import { WUSData } from '../wrus/wrus-data.js';
import { CoordinateUtils } from '../utils/coordinates.js';

document.getElementById('excelFile').addEventListener('change', handleFileUpload);

// NON PERMITTEE

// async function handleFileUpload(event) {
//   const file = event.target.files[0];
//   if (!file) return;

//   const reader = new FileReader();
//   reader.onload = async (e) => {
//     const data = new Uint8Array(e.target.result);
//     const workbook = XLSX.read(data, { type: 'array' });
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

//     console.log(`📄 Total rows read: ${rows.length}`);

//     for (let i = 7; i < rows.length; i++) {
//       const row = rows[i];

//       // Skip empty rows
//       if (!row || row.length === 0 || row.every(cell => cell === '')) {
//         continue;
//       }

//       try {
//         const owner = row[0]?.toString().trim() || '';
//         const street = row[1]?.toString().trim() || '';
//         const barangay = row[2]?.toString().trim() || '';
//         let city = row[3]?.toString().trim() || '';
//         if (city.toLowerCase() === 'quezon') {
//           city = 'Quezon City';
//         }

//         // Latitude
//         const latDeg = parseFloat(row[10]) || 0;
//         const latMin = parseFloat(row[11]) || 0;
//         const latSecDirRaw = row[12]?.toString().trim() || '';
//         const [latSecStr, latDir] = latSecDirRaw.split(/\s+/);
//         const latSec = parseFloat(latSecStr) || 0;
//         const latitude = CoordinateUtils.dmsToDecimal(latDeg, latMin, latSec, latDir || 'N');

//         // Longitude
//         const longDeg = parseFloat(row[13]) || 0;
//         const longMin = parseFloat(row[14]) || 0;
//         const longSecDirRaw = row[15]?.toString().trim() || '';
//         const [longSecStr, longDir] = longSecDirRaw.split(/\s+/);
//         const longSec = parseFloat(longSecStr) || 0;
//         const longitude = CoordinateUtils.dmsToDecimal(longDeg, longMin, longSec, longDir || 'E');

//         const type = row[20]?.toString().trim() || '';
//         const remarks = row[21]?.toString().trim() || '';
//         const isWaterSource = /^operational$/i.test(remarks);

//         const data = {
//           owner,
//           street,
//           barangay,
//           city,
//           latitude,
//           longitude,
//           type,
//           remarks,
//           isWaterSource,
//           year_conducted: '2023'
//         };

//         await WUSData.add(data);
//         console.log(`✅ Uploaded row ${i + 1}: ${owner}`);
//       } catch (err) {
//         console.error(`⚠️ Skipped row ${i + 1} due to error:`, err.message);
//         continue;
//       }

//     }

//     alert('✅ Import complete!');
//   };

//   reader.readAsArrayBuffer(file);
// }

// PERMITTEE

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    console.log(`📄 Total rows read: ${rows.length}`);

    for (let i = 7; i < rows.length; i++) { // start at 8th row (index 7)
      const row = rows[i];
      if (!row || row.length === 0 || row.every(cell => cell === '')) continue;

      try {
        const owner = row[0]?.toString().trim() || '';
        const permitNo = row[10]?.toString().trim() || '';
        const street = row[18]?.toString().trim() || '';
        const barangay = row[19]?.toString().trim() || '';
        let city = row[20]?.toString().trim() || '';
        const type = row[28]?.toString().trim() || '';     // AC column
        const remarks = row[29]?.toString().trim() || '';  // AD column

        if (city.toLowerCase() === 'quezon') {
          city = 'Quezon City';
        }

        const isWaterSource = /^operational$/i.test(remarks);

        // Latitude
        const latDeg = parseFloat(row[22]) || 0;
        const latMin = parseFloat(row[23]) || 0;
        const latSec = parseFloat(row[24]) || 0;
        const latitude = CoordinateUtils.dmsToDecimal(latDeg, latMin, latSec, 'N');

        // Longitude
        const longDeg = parseFloat(row[25]) || 0;
        const longMin = parseFloat(row[26]) || 0;
        const longSec = parseFloat(row[27]) || 0;
        const longitude = CoordinateUtils.dmsToDecimal(longDeg, longMin, longSec, 'E');

        const data = {
          owner,
          permitNo,
          street,
          barangay,
          city,
          latitude,
          longitude,
          type,
          remarks,
          isWaterSource,
          year_conducted: '2023'
        };

        await WUSData.add(data);
        console.log(`✅ Uploaded row ${i + 1}: ${owner}`);
      } catch (err) {
        console.error(`⚠️ Skipped row ${i + 1} due to error:`, err.message);
        continue;
      }
    }

    alert('✅ Import complete!');
  };

  reader.readAsArrayBuffer(file);
}
