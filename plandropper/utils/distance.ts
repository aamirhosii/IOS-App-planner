/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of the first point in decimal degrees
 * @param lon1 Longitude of the first point in decimal degrees
 * @param lat2 Latitude of the second point in decimal degrees
 * @param lon2 Longitude of the second point in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // If any coordinate is null or undefined, return a large number
  if (
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Number.MAX_SAFE_INTEGER
  }

  // Earth's radius in kilometers
  const R = 6371

  // Convert latitude and longitude from degrees to radians
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in kilometers

  return distance
}

/**
 * Formats a distance in kilometers to a user-friendly string
 * @param distance Distance in kilometers
 * @param useImperial Whether to use imperial units (miles) instead of metric (kilometers)
 * @returns Formatted distance string
 */
export function formatDistance(distance: number, useImperial = false): string {
  if (distance === Number.MAX_SAFE_INTEGER) {
    return "Unknown distance"
  }

  if (useImperial) {
    // Convert kilometers to miles (1 km ≈ 0.621371 miles)
    const miles = distance * 0.621371

    if (miles < 0.1) {
      return "Very close"
    } else if (miles < 1) {
      return `${(miles * 5280).toFixed(0)} ft away`
    } else if (miles < 10) {
      return `${miles.toFixed(1)} mi away`
    } else {
      return `${miles.toFixed(0)} mi away`
    }
  } else {
    // Use metric (kilometers)
    if (distance < 0.1) {
      return "Very close"
    } else if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m away`
    } else if (distance < 10) {
      return `${distance.toFixed(1)} km away`
    } else {
      return `${distance.toFixed(0)} km away`
    }
  }
}
