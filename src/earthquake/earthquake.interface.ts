export interface EarthquakeEvent {
  id: string;
  magnitude: number;
  location: {
    latitude: number;
    longitude: number;
    place: string;
  };
  depth: number;
  timestamp: Date;
  url: string;
  alert: string | null;
  tsunami: number;
  processed: boolean;
  notificationSent: boolean;
}

export interface EarthquakeNotification {
  title: string;
  body: string;
  data: {
    earthquakeId: string;
    magnitude: number;
    location: {
      latitude: number;
      longitude: number;
      place: string;
    };
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}
