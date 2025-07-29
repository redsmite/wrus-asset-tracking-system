export function normalizeBarangay(brgy) {
  if (!brgy || brgy.trim() === '' || ['0', 'n/a', 'bgy', 'bgy.'].includes(brgy.toLowerCase())) {
    return 'Unknown';
  }
  return brgy
    .toLowerCase()
    .replace(/^(brgy\.?|barangay|bgy\.?|bgy)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function normalizeCity(city) {
  if (!city || city.trim() === '' || city === '0' || city.toLowerCase() === 'n/a') {
    return 'Unknown';
  }
  return city.trim().replace(/\b\w/g, c => c.toUpperCase());
}