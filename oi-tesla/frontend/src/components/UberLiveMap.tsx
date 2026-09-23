'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Navigation, Zap, MapPin, Layers, Crosshair } from 'lucide-react';

interface Coordinates {
  lat: number;
  lng: number;
  name: string;
}

const DHAKA_COORDINATES: Record<string, Coordinates> = {
  'a1000000-0000-0000-0000-000000000001': { lat: 23.7937, lng: 90.4066, name: 'Banani' },
  'a1000000-0000-0000-0000-000000000002': { lat: 23.7785, lng: 90.4182, name: 'Gulshan 1' },
  'a1000000-0000-0000-0000-000000000003': { lat: 23.7776, lng: 90.4054, name: 'Mohakhali' },
  'a1000000-0000-0000-0000-000000000004': { lat: 23.7516, lng: 90.3773, name: 'Dhanmondi' },
  'default_pickup': { lat: 23.7937, lng: 90.4066, name: 'Banani (Road 11)' },
  'default_destination': { lat: 23.7776, lng: 90.4054, name: 'Mohakhali (Wireless)' },
};

interface UberLiveMapProps {
  pickupId?: string;
  destinationId?: string;
  heightClass?: string;
  showVehicleAnimation?: boolean;
}

export const UberLiveMap: React.FC<UberLiveMapProps> = ({
  pickupId = 'a1000000-0000-0000-0000-000000000001',
  destinationId = 'a1000000-0000-0000-0000-000000000003',
  heightClass = 'h-52',
  showVehicleAnimation = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const vehicleMarkerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [mapMode, setMapMode] = useState<'uber_dark' | 'google_maps'>('uber_dark');
  const [googleKeyExists, setGoogleKeyExists] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    setGoogleKeyExists(!!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  }, []);

  const pickupCoord = DHAKA_COORDINATES[pickupId] || DHAKA_COORDINATES['default_pickup'];
  const destCoord = DHAKA_COORDINATES[destinationId] || DHAKA_COORDINATES['default_destination'];

  useEffect(() => {
    let isMounted = true;

    // Dynamically import Leaflet client-side to prevent Next.js SSR window error
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map centered between pickup and destination
      const centerLat = (pickupCoord.lat + destCoord.lat) / 2;
      const centerLng = (pickupCoord.lng + destCoord.lng) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // Sleek Uber-style Dark Matter tiles from CartoDB (High-contrast, dark mode)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Custom Pickup DivIcon (Pulsing Teal Ring)
      const pickupIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-6 h-6 bg-[#46f1c5]/30 rounded-full animate-ping"></span>
            <div class="w-4 h-4 bg-[#46f1c5] rounded-full border-2 border-[#0f1419] shadow-lg flex items-center justify-center">
              <div class="w-1.5 h-1.5 bg-[#00513f] rounded-full"></div>
            </div>
            <div class="absolute -top-6 whitespace-nowrap bg-[#1b2025]/90 border border-[#30353b] text-[#46f1c5] text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
              ${pickupCoord.name}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Custom Destination DivIcon (Gold Flag / Pin)
      const destIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-4 h-4 bg-[#feb700] rounded-full border-2 border-[#0f1419] shadow-lg flex items-center justify-center">
              <div class="w-1.5 h-1.5 bg-[#593d00] rounded-full"></div>
            </div>
            <div class="absolute -top-6 whitespace-nowrap bg-[#1b2025]/90 border border-[#30353b] text-[#feb700] text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
              ${destCoord.name}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Add markers
      const pMarker = L.marker([pickupCoord.lat, pickupCoord.lng], { icon: pickupIcon }).addTo(map);
      const dMarker = L.marker([destCoord.lat, destCoord.lng], { icon: destIcon }).addTo(map);
      markersRef.current = [pMarker, dMarker];

      // Route Path Curve simulation along Dhaka transit arteries
      const midLat = (pickupCoord.lat + destCoord.lat) / 2 + 0.002;
      const midLng = (pickupCoord.lng + destCoord.lng) / 2 + 0.003;
      const routePoints: [number, number][] = [
        [pickupCoord.lat, pickupCoord.lng],
        [midLat, midLng],
        [destCoord.lat, destCoord.lng],
      ];

      // Polyline (Glowing Neon Cyan Route)
      const routeLine = L.polyline(routePoints, {
        color: '#46f1c5',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(map);
      polylineRef.current = routeLine;

      // Fit bounds with comfortable padding
      const group = L.featureGroup([pMarker, dMarker]);
      map.fitBounds(group.getBounds(), { padding: [35, 35] });

      // Moving Tesla Trike ("Bullet") Marker Animation
      if (showVehicleAnimation) {
        const vehicleIcon = L.divIcon({
          className: 'custom-vehicle-icon',
          html: `
            <div class="relative flex items-center justify-center animate-pulse">
              <div class="w-8 h-8 rounded-full bg-[#00513f] border-2 border-[#46f1c5] shadow-lg flex items-center justify-center text-[#46f1c5]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-5h14v5z"/>
                </svg>
              </div>
              <span class="absolute -bottom-4 whitespace-nowrap bg-[#1b2025] text-[#46f1c5] text-[8px] font-bold px-1 rounded border border-[#00513f]">
                Bullet (86%)
              </span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const vMarker = L.marker([pickupCoord.lat, pickupCoord.lng], { icon: vehicleIcon }).addTo(map);
        vehicleMarkerRef.current = vMarker;

        // Smooth continuous cruising animation
        let progress = 0;
        const animate = () => {
          progress = (progress + 0.003) % 1;
          const currentLat = pickupCoord.lat + (destCoord.lat - pickupCoord.lat) * progress;
          const currentLng = pickupCoord.lng + (destCoord.lng - pickupCoord.lng) * progress;
          vMarker.setLatLng([currentLat, currentLng]);
          animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
      }

      setIsLoaded(true);
    });

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pickupId, destinationId, showVehicleAnimation, mapMode]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && markersRef.current.length === 2) {
      import('leaflet').then((L) => {
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [35, 35] });
      });
    }
  };

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-surface-container-high/60 shadow-xl bg-surface-container-lowest`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Overlay Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-lowest/85 backdrop-blur-md rounded-full border border-surface-container-high shadow-md pointer-events-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[10px] font-bold text-on-surface font-sora">
            Dhaka Transit • Banani Corridor
          </span>
        </div>

        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className="w-8 h-8 rounded-full bg-surface-container-lowest/85 backdrop-blur-md border border-surface-container-high flex items-center justify-center text-primary hover:bg-surface-bright shadow-md transition active:scale-90 pointer-events-auto"
          title="Recenter Route"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Route Summary Bar */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-container-high/80 flex items-center justify-between text-[11px] shadow-lg pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-semibold text-on-surface font-sora">
            <span className="text-primary">{pickupCoord.name}</span>
            <span className="text-on-surface-variant">→</span>
            <span className="text-secondary">{destCoord.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            ⚡ Bullet Live GPS
          </span>
        </div>
      </div>
    </div>
  );
};
