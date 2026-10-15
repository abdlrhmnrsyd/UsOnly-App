import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createAvatarIcon = (avatarUrl, nickname, isMe) => {
  const borderColor = isMe ? '#f43f66' : '#7c38ad';
  const shadowColor = isMe ? 'rgba(244, 63, 102, 0.4)' : 'rgba(124, 56, 173, 0.4)';

  return L.divIcon({
    className: 'custom-couple-marker',
    html: `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: ${shadowColor}; animation: pulse 2s infinite;"></div>
        <img src="${avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" 
             style="width: 40px; height: 40px; border-radius: 9999px; object-fit: cover; border: 3px solid ${borderColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.5); position: relative; z-index: 10;" 
             alt="${nickname}" />
        <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background: #120f1a; border: 1px solid ${borderColor}; color: #fdfcfd; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 9999px; white-space: nowrap; z-index: 20; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">
          ${nickname}
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -28],
  });
};

export const CoupleMap = ({ myLocation, partnerLocation, myUser, partnerUser }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({ myMarker: null, partnerMarker: null, line: null });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around Jakarta coordinates (-6.2088, 106.8456)
      const initialLat = myLocation?.latitude || partnerLocation?.latitude || -6.2088;
      const initialLng = myLocation?.longitude || partnerLocation?.longitude || 106.8456;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([initialLat, initialLng], 13);

      // OpenStreetMap dark-adapted tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing markers & lines
    if (markersRef.current.myMarker) map.removeLayer(markersRef.current.myMarker);
    if (markersRef.current.partnerMarker) map.removeLayer(markersRef.current.partnerMarker);
    if (markersRef.current.line) map.removeLayer(markersRef.current.line);

    const bounds = [];

    // Add My Marker if location available and sharing allowed
    if (myLocation?.latitude && myLocation?.longitude) {
      const myIcon = createAvatarIcon(myUser?.avatar_url, myUser?.nickname || 'Kamu', true);
      const myMarker = L.marker([myLocation.latitude, myLocation.longitude], { icon: myIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-size: 12px; font-family: sans-serif; line-height: 1.4;">
            <strong style="color: #fb718c;">${myUser?.nickname || 'Kamu'}</strong><br/>
            <span>${myLocation.address_label || 'Lokasimu saat ini'}</span><br/>
            <span style="color: #94a3b8; font-size: 10px;">${myLocation.status_note || ''}</span>
          </div>
        `);

      markersRef.current.myMarker = myMarker;
      bounds.push([myLocation.latitude, myLocation.longitude]);
    }

    // Add Partner Marker only if partner enabled sharing!
    if (partnerLocation?.is_sharing_enabled && partnerLocation?.latitude && partnerLocation?.longitude) {
      const partnerIcon = createAvatarIcon(partnerUser?.avatar_url, partnerUser?.nickname || 'Pasangan', false);
      const partnerMarker = L.marker([partnerLocation.latitude, partnerLocation.longitude], { icon: partnerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-size: 12px; font-family: sans-serif; line-height: 1.4;">
            <strong style="color: #9e59d4;">${partnerUser?.nickname || 'Pasangan'}</strong><br/>
            <span>${partnerLocation.address_label || 'Lokasi Pasangan'}</span><br/>
            <span style="color: #94a3b8; font-size: 10px;">${partnerLocation.status_note || ''}</span>
          </div>
        `);

      markersRef.current.partnerMarker = partnerMarker;
      bounds.push([partnerLocation.latitude, partnerLocation.longitude]);
    }

    // Connect with a sweet dashed romantic line if both markers exist
    if (bounds.length === 2) {
      const polyline = L.polyline(bounds, {
        color: '#f43f66',
        weight: 2.5,
        opacity: 0.7,
        dashArray: '6, 8',
      }).addTo(map);

      markersRef.current.line = polyline;
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [myLocation, partnerLocation, myUser, partnerUser]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-charcoal-700/60 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] z-10" />
    </div>
  );
};
