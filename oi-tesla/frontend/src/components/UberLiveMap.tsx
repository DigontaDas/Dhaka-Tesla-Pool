import React, { useEffect, useRef, useState } from 'react';
import { Navigation, Zap, MapPin, Layers, Crosshair } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Coordinates {
  lat: number;
  lng: number;
  name: string;
  name_bn: string;
}

const DHAKA_COORDINATES: Record<string, Coordinates> = {
  'a1000000-0000-0000-0000-000000000001': { lat: 23.7937, lng: 90.4066, name: 'Banani', name_bn: 'বনানী (১১ নং রোড)' },
  'a1000000-0000-0000-0000-000000000002': { lat: 23.7785, lng: 90.4182, name: 'Gulshan 1', name_bn: 'গুলশান ১ (সার্কেল)' },
  'a1000000-0000-0000-0000-000000000003': { lat: 23.7776, lng: 90.4054, name: 'Mohakhali', name_bn: 'মহাখালী (ওয়ারলেস গেট)' },
  'a1000000-0000-0000-0000-000000000004': { lat: 23.7516, lng: 90.3773, name: 'Dhanmondi', name_bn: 'ধানমন্ডি (২৭ নং রোড)' },
  'default_pickup': { lat: 23.7937, lng: 90.4066, name: 'Banani (Road 11)', name_bn: 'বনানী (১১ নং রোড)' },
  'default_destination': { lat: 23.7776, lng: 90.4054, name: 'Mohakhali (Wireless)', name_bn: 'মহাখালী (ওয়ারলেস গেট)' },
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
  const { language } = useLanguage();
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

      // Patch Leaflet DomUtil.getPosition to prevent crash on detached/unmounted panes
      if (L && L.DomUtil && !(L.DomUtil as any)._pos_patched) {
        const origGetPosition = L.DomUtil.getPosition;
        L.DomUtil.getPosition = function (el: any) {
          if (!el) {
            return new L.Point(0, 0);
          }
          return origGetPosition.call(this, el);
        };
        (L.DomUtil as any)._pos_patched = true;
      }

      // Patch Leaflet Map.prototype._onZoomTransitionEnd to avoid accessing null mapPane
      if (L && L.Map && L.Map.prototype && !(L.Map.prototype as any)._zoom_patched) {
        const origZoomTransitionEnd = (L.Map.prototype as any)._onZoomTransitionEnd;
        (L.Map.prototype as any)._onZoomTransitionEnd = function () {
          if (!this._mapPane) {
            this._animatingZoom = false;
            return;
          }
          if (origZoomTransitionEnd) {
            origZoomTransitionEnd.call(this);
          }
        };
        (L.Map.prototype as any)._zoom_patched = true;
      }

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
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
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
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

      // Fit bounds with comfortable padding (disable animated transitions)
      const group = L.featureGroup([pMarker, dMarker]);
      map.fitBounds(group.getBounds(), { padding: [35, 35], animate: false });

      // Moving Electric Rickshaw ("Bullet" with Tesla Emblem) Marker Animation
      if (showVehicleAnimation) {
        const vehicleIcon = L.divIcon({
          className: 'custom-vehicle-icon',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-11 h-11 bg-[#46f1c5]/25 rounded-full animate-ping"></span>
              <div class="w-10 h-10 rounded-full bg-[#002b20] border-2 border-[#46f1c5] shadow-[0_0_15px_rgba(70,241,197,0.7)] flex items-center justify-center p-1">
                <!-- Authentic Dhaka 3-Wheeled Electric Rickshaw SVG with Tesla T Emblem -->
                <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
                  <path d="M14 26 C14 15, 26 12, 38 12 C44 12, 48 15, 50 20 L50 34 L14 34 Z" fill="#46f1c5" fill-opacity="0.3" stroke="#46f1c5" stroke-width="2.5"/>
                  <path d="M22 16 C23 22, 23 28, 23 34" stroke="#46f1c5" stroke-width="1.5" stroke-dasharray="2 2"/>
                  <path d="M50 22 L58 30 L58 40 L50 40" stroke="#46f1c5" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M10 40 L58 40" stroke="#46f1c5" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="18" cy="48" r="7" stroke="#46f1c5" stroke-width="2.5" fill="#12171c"/>
                  <circle cx="54" cy="48" r="7" stroke="#46f1c5" stroke-width="2.5" fill="#12171c"/>
                  <!-- Stylized Tesla T Emblem on Rickshaw Battery -->
                  <path d="M28 20 H34 M31 20 V25" stroke="#feb700" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="absolute -bottom-5 whitespace-nowrap bg-[#0f1419] text-[#46f1c5] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#00513f] shadow">
                ⚡ Bullet (Tesla EV)
              </span>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const vMarker = L.marker([pickupCoord.lat, pickupCoord.lng], { icon: vehicleIcon }).addTo(map);
        vehicleMarkerRef.current = vMarker;

        // Smooth continuous cruising animation
        let progress = 0;
        const animate = () => {
          if (!isMounted || !mapInstanceRef.current || !vehicleMarkerRef.current) return;
          progress = (progress + 0.003) % 1;
          const currentLat = pickupCoord.lat + (destCoord.lat - pickupCoord.lat) * progress;
          const currentLng = pickupCoord.lng + (destCoord.lng - pickupCoord.lng) * progress;
          try {
            vMarker.setLatLng([currentLat, currentLng]);
            if (isMounted) {
              animationFrameRef.current = requestAnimationFrame(animate);
            }
          } catch (err) {
            // Ignore updates during unmount
          }
        };
        animationFrameRef.current = requestAnimationFrame(animate);
      }

      setIsLoaded(true);
    });

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          // Suppress unmount errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, [pickupId, destinationId, showVehicleAnimation, mapMode, language]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && markersRef.current.length === 2) {
      import('leaflet').then((L) => {
        if (!mapInstanceRef.current) return;
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [35, 35], animate: false });
      });
    }
  };

  const displayName = (coord: Coordinates) => (language === 'bn' ? coord.name_bn : coord.name);

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
            {language === 'bn' ? 'ঢাকা টেসলা রিকশা ট্রানজিট • বনানী করিডোর' : 'Dhaka Tesla Rickshaw Transit • Banani'}
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
          <div className="flex items-center gap-1 font-semibold text-on-surface font-sora text-xs">
            <span className="text-primary">{displayName(pickupCoord)}</span>
            <span className="text-on-surface-variant">→</span>
            <span className="text-secondary">{displayName(destCoord)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            {language === 'bn' ? '⚡ বুলেট রিকশা লাইভ GPS' : '⚡ Bullet Live GPS'}
          </span>
        </div>
      </div>
    </div>
  );
};

