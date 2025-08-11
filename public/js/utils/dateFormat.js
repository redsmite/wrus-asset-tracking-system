export function updateReportTimestamp() {
  const now = new Date();
  const formatted = now.toLocaleString('en-US', {
    month: 'long',    // MMMM
    day: '2-digit',   // dd
    year: 'numeric',  // YYYY
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true      // AM/PM format
  });

  const timestampElement = document.getElementById('reportTimestamp');
  if (timestampElement) {
    timestampElement.textContent = `Report generated on ${formatted}`;
  }
}