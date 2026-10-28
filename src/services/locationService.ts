export interface RealTimeLocation {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  speed?: number | null;
  heading?: number | null;
  altitude?: number | null;
  timestamp: string;
  source: 'gps_high_accuracy' | 'browser_geolocation' | 'ip_network' | 'manual_override';
  address: string;
  city?: string;
  state?: string;
  country?: string;
  statusText: string;
}

type LocationListener = (location: RealTimeLocation) => void;

class LocationService {
  private currentLocation: RealTimeLocation | null = null;
  private listeners: LocationListener[] = [];
  private watchId: number | null = null;
  private isLocating: boolean = false;
  private reverseGeocodeCache = new Map<string, string>();

  constructor() {
    this.initSavedLocation();
    this.startTracking();
  }

  private initSavedLocation() {
    try {
      const saved = localStorage.getItem('safelynk_last_known_location');
      if (saved) {
        this.currentLocation = JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }

  public subscribe(listener: LocationListener): () => void {
    this.listeners.push(listener);
    if (this.currentLocation) {
      listener(this.currentLocation);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    if (!this.currentLocation) return;
    try {
      localStorage.setItem('safelynk_last_known_location', JSON.stringify(this.currentLocation));
    } catch {
      // ignore
    }
    for (const listener of this.listeners) {
      listener(this.currentLocation);
    }
  }

  public getLocation(): RealTimeLocation | null {
    return this.currentLocation;
  }

  // Reverse geocodes coordinates to a human-readable street address via OpenStreetMap Nominatim
  public async reverseGeocode(lat: number, lng: number): Promise<{ address: string; city?: string; state?: string; country?: string }> {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (this.reverseGeocodeCache.has(cacheKey)) {
      return { address: this.reverseGeocodeCache.get(cacheKey)! };
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SAFELYNK-Safety-App/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
        const addrObj = data.address || {};
        const city = addrObj.city || addrObj.town || addrObj.village || addrObj.suburb;
        const state = addrObj.state || addrObj.province;
        const country = addrObj.country;

        this.reverseGeocodeCache.set(cacheKey, address);
        return { address, city, state, country };
      }
    } catch {
      // Fallback
    }

    return { address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}` };
  }

  // Fast network IP fallback in case browser GPS permission is pending or denied
  private async fetchIpFallbackLocation(): Promise<boolean> {
    try {
      const res = await fetch('https://ipwho.is/');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.latitude && data.longitude) {
          // If we already have high accuracy GPS, do not overwrite with coarse IP
          if (this.currentLocation && this.currentLocation.source === 'gps_high_accuracy') {
            return false;
          }

          const city = data.city || '';
          const region = data.region || '';
          const country = data.country || '';
          const fullAddress = [city, region, country].filter(Boolean).join(', ') || 'Approximate Network Location';

          this.currentLocation = {
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            accuracy: 1500, // IP accuracy is typically ~1-2km
            timestamp: new Date().toISOString(),
            source: 'ip_network',
            address: fullAddress,
            city,
            state: region,
            country,
            statusText: `Network IP Fix: ${city}, ${country}`
          };
          this.notify();
          return true;
        }
      }
    } catch {
      // try backup ipapi
      try {
        const res2 = await fetch('https://ipapi.co/json/');
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2.latitude && data2.longitude) {
            if (this.currentLocation && this.currentLocation.source === 'gps_high_accuracy') {
              return false;
            }
            const city = data2.city || '';
            const region = data2.region || '';
            const country = data2.country_name || '';
            const fullAddress = [city, region, country].filter(Boolean).join(', ') || 'Network Location';

            this.currentLocation = {
              latitude: Number(data2.latitude),
              longitude: Number(data2.longitude),
              accuracy: 2000,
              timestamp: new Date().toISOString(),
              source: 'ip_network',
              address: fullAddress,
              city,
              state: region,
              country,
              statusText: `Network Fix: ${city}, ${country}`
            };
            this.notify();
            return true;
          }
        }
      } catch {
        // Fallback
      }
    }
    return false;
  }

  // Primary entry: Starts active continuous GPS tracking
  public startTracking() {
    if (this.isLocating) return;
    this.isLocating = true;

    // Immediately trigger IP fallback in background so user has their real town/city within 500ms
    this.fetchIpFallbackLocation();

    if (!('geolocation' in navigator)) {
      if (!this.currentLocation) {
        this.fetchIpFallbackLocation();
      }
      return;
    }

    // High accuracy request
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        const geo = await this.reverseGeocode(lat, lng);

        this.currentLocation = {
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          altitude: pos.coords.altitude,
          timestamp: new Date(pos.timestamp).toISOString(),
          source: acc <= 100 ? 'gps_high_accuracy' : 'browser_geolocation',
          address: geo.address,
          city: geo.city,
          state: geo.state,
          country: geo.country,
          statusText: acc <= 30 ? `Live High-Accuracy GPS (±${acc}m)` : `Live Location Fix (±${acc}m)`
        };
        this.notify();
      },
      (err) => {
        console.warn('[LocationService] High accuracy getCurrentPosition warning:', err.message);
        // If GPS permission denied or timed out, make sure IP network location is present
        this.fetchIpFallbackLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
      }
    );

    // Watch position continuously as user moves
    try {
      this.watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);

          // Only reverse geocode if moved substantially (>0.0005 deg) or if we don't have address yet
          let address = this.currentLocation?.address || 'Locating real-time address...';
          let city = this.currentLocation?.city;
          let state = this.currentLocation?.state;
          let country = this.currentLocation?.country;

          if (!this.currentLocation || Math.abs(this.currentLocation.latitude - lat) > 0.0008 || Math.abs(this.currentLocation.longitude - lng) > 0.0008) {
            const geo = await this.reverseGeocode(lat, lng);
            address = geo.address;
            city = geo.city;
            state = geo.state;
            country = geo.country;
          }

          this.currentLocation = {
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            altitude: pos.coords.altitude,
            timestamp: new Date(pos.timestamp).toISOString(),
            source: acc <= 100 ? 'gps_high_accuracy' : 'browser_geolocation',
            address,
            city,
            state,
            country,
            statusText: acc <= 30 ? `Live High-Accuracy GPS (±${acc}m)` : `Live Location Fix (±${acc}m)`
          };
          this.notify();
        },
        (err) => {
          console.warn('[LocationService] watchPosition error:', err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000
        }
      );
    } catch (e) {
      console.warn('[LocationService] Watch position init failed:', e);
    }
  }

  // Force an immediate re-calibration / re-locate request
  public async refreshLocation(): Promise<RealTimeLocation | null> {
    return this.forceRefreshLocation();
  }

  public async forceRefreshLocation(): Promise<RealTimeLocation | null> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        this.fetchIpFallbackLocation().then(() => resolve(this.currentLocation));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);
          const geo = await this.reverseGeocode(lat, lng);

          this.currentLocation = {
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            altitude: pos.coords.altitude,
            timestamp: new Date(pos.timestamp).toISOString(),
            source: acc <= 100 ? 'gps_high_accuracy' : 'browser_geolocation',
            address: geo.address,
            city: geo.city,
            state: geo.state,
            country: geo.country,
            statusText: `Updated Live GPS (±${acc}m)`
          };
          this.notify();
          resolve(this.currentLocation);
        },
        async () => {
          await this.fetchIpFallbackLocation();
          resolve(this.currentLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        }
      );
    });
  }

  // Allows setting manual testing coordinates if user wants to simulate a specific place
  public async setManualLocation(lat: number, lng: number, customLabel?: string) {
    const geo = await this.reverseGeocode(lat, lng);
    this.currentLocation = {
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      timestamp: new Date().toISOString(),
      source: 'manual_override',
      address: customLabel || geo.address,
      city: geo.city,
      state: geo.state,
      country: geo.country,
      statusText: `Manual Pin Set: ${geo.city || lat.toFixed(4)}`
    };
    this.notify();
  }
}

export const locationService = new LocationService();
