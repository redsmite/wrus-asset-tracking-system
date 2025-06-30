export const CoordinateUtils = {
  // Convert DMS to Decimal
  dmsToDecimal(degrees, minutes, seconds, direction) {
    let decimal = Math.abs(degrees) + (minutes / 60) + (seconds / 3600);
    if (['S', 'W'].includes(direction.toUpperCase())) {
      decimal *= -1;
    }
    return decimal;
  },

  // Convert Decimal to DMS
  decimalToDMS(decimal) {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = (minutesFloat - minutes) * 60;

    const direction = decimal >= 0 ? 'N/E' : 'S/W';

    return {
      degrees,
      minutes,
      seconds: parseFloat(seconds.toFixed(2)),
      direction
    };
  },

  // Format DMS to string
  formatDMS({degrees, minutes, seconds, direction}) {
    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  }
};