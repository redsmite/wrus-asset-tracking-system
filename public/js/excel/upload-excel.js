import { WUSData } from '../data/cache/wrus-data.js'
import { CoordinateUtils } from '../utils/coordinates.js';
import { NotificationBox, Confirmation } from '../components/notification.js';


//PERMITTEE
export function importExcelPermittees() {
  const logContainer = document.getElementById('importLogContainer');
  const logArea = document.getElementById('importLog');
  const loader = document.getElementById('importLoader');
  const warning = document.getElementById('importWarning');

  const appendLog = (message, type = 'info') => {
    const color = type === 'success' ? 'text-success' : type === 'error' ? 'text-danger' : 'text-secondary';
    logArea.innerHTML += `<div class="${color}">${message}</div>`;
    logArea.scrollTop = logArea.scrollHeight;
  };

  document.getElementById('importBtn').addEventListener('click', async () => {
    const file = document.getElementById('excelFile').files[0];
    const yearConducted = document.getElementById('yearConducted').value.trim();

    if (!file) {
      NotificationBox.show('Please select an Excel file first.', 'error');
      return;
    }

    if (!yearConducted || isNaN(yearConducted) || yearConducted.length !== 4) {
      NotificationBox.show('Please enter a valid 4-digit year.', 'error');
      return;
    }

    Confirmation.show(`Import data from Excel for year ${yearConducted}?`, async (confirmed) => {
      if (!confirmed) return;

      // Reset log UI
      logArea.innerHTML = '';
      logContainer.classList.remove('d-none');
      loader.classList.remove('d-none'); // Show loader
      warning.classList.remove('d-none');

      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        appendLog(`📄 Total rows read: ${rows.length}`);

        for (let i = 7; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || row.every(cell => cell === '')) continue;

          try {
            const owner = row[0]?.toString().trim() || '';
            const representative = row[5]?.toString().trim() || '';
            const designation = row[6]?.toString().trim() || '';
            const phone = row[7]?.toString().trim() || '';
            const permitNo = row[10]?.toString().trim() || '';
            const street = row[18]?.toString().trim() || '';
            const barangay = row[19]?.toString().trim() || '';
            let city = row[20]?.toString().trim() || '';
            const type = row[28]?.toString().trim() || '';
            const status = row[29]?.toString().trim() || '';
            const date_inspected = row[34]?.toString().trim() || '';
            const remarks = row[38]?.toString().trim() || '';

            if (city.toLowerCase() === 'quezon') {
              city = 'Quezon City';
            }

            const isWaterSource = /^operational$/i.test(status);

            const latDeg = parseFloat(row[22]) || 0;
            const latMin = parseFloat(row[23]) || 0;
            const latSec = parseFloat(row[24]) || 0;
            const latitude = CoordinateUtils.dmsToDecimal(latDeg, latMin, latSec, 'N');

            const longDeg = parseFloat(row[25]) || 0;
            const longMin = parseFloat(row[26]) || 0;
            const longSec = parseFloat(row[27]) || 0;
            const longitude = CoordinateUtils.dmsToDecimal(longDeg, longMin, longSec, 'E');

            const record = {
              owner,
              representative,
              designation,
              phone,
              permitNo,
              street,
              barangay,
              city,
              latitude,
              longitude,
              type,
              status,
              date_inspected,
              remarks,
              isWaterSource,
              year_conducted: yearConducted
            };

            await WUSData.add(record);
            appendLog(`✅ Uploaded row ${i + 1}: ${owner}`, 'success');
          } catch (err) {
            appendLog(`⚠️ Skipped row ${i + 1} due to error: ${err.message}`, 'error');
          }
        }

        loader.classList.add('d-none'); // Hide loader
        warning.classList.add('d-none');
        NotificationBox.show('Import complete!');
      };

      reader.readAsArrayBuffer(file);
    });
  });
}

//NON PERMITTEE

export function importExcelNonPermittees() {
  const logContainer = document.getElementById('importLogContainer');
  const logArea = document.getElementById('importLog');
  const loader = document.getElementById('importLoader');
  const warning = document.getElementById('importWarning');

  const appendLog = (message, type = 'info') => {
    const color =
      type === 'success'
        ? 'text-success'
        : type === 'error'
        ? 'text-danger'
        : 'text-secondary';
    logArea.innerHTML += `<div class="${color}">${message}</div>`;
    logArea.scrollTop = logArea.scrollHeight;
  };

  document
    .getElementById('importBtnNonPerm')
    .addEventListener('click', async () => {
      const file = document.getElementById('excelFileNonPerm').files[0];
      const year = document.getElementById('yearConductedNonPerm').value;

      if (!file || !year) {
        NotificationBox.show(
          '⚠️ Please select an Excel file and enter the year.',
          'error'
        );
        return;
      }

      Confirmation.show(
        `Are you sure you want to import Non-Permittees data for year ${year}?`,
        (confirmed) => {
          if (!confirmed) return;

          // Reset log UI
          logArea.innerHTML = '';
          logContainer.classList.remove('d-none');
          loader.classList.remove('d-none'); // Show loader
          warning.classList.remove('d-none');

          const reader = new FileReader();
          reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, {
              header: 1,
              defval: '',
            });

            appendLog(`📄 Total rows read: ${rows.length}`);

            for (let i = 7; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0 || row.every((cell) => cell === ''))
                continue;

              try {
                const owner = row[0]?.toString().trim() || '';
                const street = row[1]?.toString().trim() || '';
                const barangay = row[2]?.toString().trim() || '';
                let city = row[3]?.toString().trim() || '';
                if (city.toLowerCase() === 'quezon') city = 'Quezon City';
                const representative = row[5]?.toString().trim() || '';
                const designation = row[6]?.toString().trim() || '';
                const phone = row[7]?.toString().trim() || '';

                // Latitude
                const latDeg = parseFloat(row[10]) || 0;
                const latMin = parseFloat(row[11]) || 0;
                const latSecDirRaw = row[12]?.toString().trim() || '';
                const [latSecStr, latDir] = latSecDirRaw.split(/\s+/);
                const latSec = parseFloat(latSecStr) || 0;
                const latitude = CoordinateUtils.dmsToDecimal(
                  latDeg,
                  latMin,
                  latSec,
                  latDir || 'N'
                );

                // Longitude
                const longDeg = parseFloat(row[13]) || 0;
                const longMin = parseFloat(row[14]) || 0;
                const longSecDirRaw = row[15]?.toString().trim() || '';
                const [longSecStr, longDir] = longSecDirRaw.split(/\s+/);
                const longSec = parseFloat(longSecStr) || 0;
                const longitude = CoordinateUtils.dmsToDecimal(
                  longDeg,
                  longMin,
                  longSec,
                  longDir || 'E'
                );

                const type = row[20]?.toString().trim() || '';
                const status = row[21]?.toString().trim() || '';
                const date_inspected = row[23]?.toString().trim() || '';
                const remarks = row[27]?.toString().trim() || '';
                const isWaterSource = /^operational$/i.test(status);

                const record = {
                  owner,
                  street,
                  barangay,
                  city,
                  representative,
                  designation,
                  phone,
                  latitude,
                  longitude,
                  type,
                  status,
                  remarks,
                  isWaterSource,
                  date_inspected,
                  year_conducted: year,
                };

                await WUSData.add(record);
                appendLog(`✅ Uploaded row ${i + 1}: ${owner}`, 'success');
              } catch (err) {
                appendLog(
                  `⚠️ Skipped row ${i + 1} due to error: ${err.message}`,
                  'error'
                );
              }
            }

            loader.classList.add('d-none'); // Hide loader
            warning.classList.add('d-none');
            NotificationBox.show('Import complete!');
          };

          reader.readAsArrayBuffer(file);
        }
      );
    });
}


