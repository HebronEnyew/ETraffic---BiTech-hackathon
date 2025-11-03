/**
 * GPS Validation Service
 * Validates that reported location matches user's actual GPS location
 */

export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
export function calculateDistance(
  loc1: Location,
  loc2: Location
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRadians(loc2.latitude - loc1.latitude);
  const dLon = toRadians(loc2.longitude - loc1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(loc1.latitude)) *
      Math.cos(toRadians(loc2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate GPS location match
 * Returns validation result with distance and warning flag
 */
export function validateGPSLocation(
  reportedLocation: Location,
  actualGPSLocation: Location
): {
  isValid: boolean;
  distanceMeters: number;
  warning: boolean;
} {
  const maxDistance = parseInt(
    process.env.GPS_MAX_DISTANCE_METERS || '500'
  );

  const distance = calculateDistance(reportedLocation, actualGPSLocation);

  return {
    isValid: distance <= maxDistance,
    distanceMeters: distance,
    warning: distance > maxDistance * 0.7, // Warning at 70% of max distance
  };
}

