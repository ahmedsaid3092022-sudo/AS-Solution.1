/**
 * Service for handling GPS Attendance, Haversine Distance Calculations,
 * and Geofencing Validations.
 */

export interface GeofenceValidationResult {
  isWithin: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  messageAr: string;
  messageEn: string;
}

export const geoService = {
  /**
   * Calculates distance between two GPS coordinates in meters using Haversine formula.
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  },

  /**
   * Validates if a coordinate is within a geofenced area.
   */
  validateGeofence(
    userLat: number,
    userLng: number,
    targetLat: number,
    targetLng: number,
    allowedRadiusMeters: number = 200
  ): GeofenceValidationResult {
    const distanceMeters = this.calculateDistance(userLat, userLng, targetLat, targetLng);
    const isWithin = distanceMeters <= allowedRadiusMeters;

    return {
      isWithin,
      distanceMeters,
      allowedRadiusMeters,
      messageAr: isWithin
        ? `بصمة مقبولة: أنت داخل نطاق موقع العمل (${distanceMeters} م من المركز)`
        : `خارج نطاق العمل المصرح به: المسافة ${distanceMeters} م والحد المسموح ${allowedRadiusMeters} م`,
      messageEn: isWithin
        ? `Punch accepted: Within work site (${distanceMeters}m from center)`
        : `Outside geofenced work site: Distance is ${distanceMeters}m (Allowed: ${allowedRadiusMeters}m)`,
    };
  },

  /**
   * Fetch current GPS location from navigator or fallback mock
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback mock coordinates (Cairo HQ)
        resolve({ latitude: 30.0444, longitude: 31.2357 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn('Geolocation error or denied, returning site default', err);
          // Return default site coordinates (Cairo HQ) for graceful demo/testing
          resolve({ latitude: 30.0444, longitude: 31.2357 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  },
};
