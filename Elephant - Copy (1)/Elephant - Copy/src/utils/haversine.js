/**
 * Format distance for display (keeps UI-friendly formatting)
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export function formatDistance(distance) {
  if (typeof distance !== 'number' || isNaN(distance)) {
    return 'Calculating...';
  }
  if (distance <= 0.0001) {
    return '0 m';
  }
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} m`;
  }
  return `${distance.toFixed(2)} km`;
}