import { isWithinGeofence, haversineDistanceM } from './utils';

describe('Geofence utils', () => {
  it('should return true when within radius', () => {
    const centerLat = 41.0082;
    const centerLon = 28.9784;
    const userLat = 41.0083;
    const userLon = 28.9785;
    expect(isWithinGeofence(userLat, userLon, centerLat, centerLon, 300)).toBe(true);
  });

  it('should return false when outside radius', () => {
    expect(isWithinGeofence(41.05, 28.98, 41.0082, 28.9784, 100)).toBe(false);
  });

  it('haversine distance should be reasonable', () => {
    const d = haversineDistanceM(41.0082, 28.9784, 41.0083, 28.9785);
    expect(d).toBeLessThan(50);
  });
});
