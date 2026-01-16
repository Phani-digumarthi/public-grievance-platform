"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for missing marker icons in React Leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Kakinada Area Coordinates (Lat, Lng)
const areaCoordinates: Record<string, [number, number]> = {
  "Bhanugudi": [16.9604, 82.2381],
  "Sarpavaram": [16.9945, 82.2530],
  "Gandhi Nagar": [16.9535, 82.2435],
  "Main Road": [16.9341, 82.2270],
  "Jagannaickpur": [16.9320, 82.2350],
  "Ramanayyapeta": [16.9750, 82.2450],
};

interface MapProps {
  grievances: any[];
}

export default function GrievanceMap({ grievances }: MapProps) {
  // Center map on Kakinada
  const centerPosition: [number, number] = [16.9500, 82.2400];

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 z-0">
      <MapContainer 
        center={centerPosition} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {grievances.map((g) => {
          // Get coordinate for the grievance area
          const position = areaCoordinates[g.area];
          
          // Only show marker if we have coordinates for that area
          if (position) {
            return (
              <Marker key={g._id} position={position} icon={icon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-slate-900">{g.area}</p>
                    <p className="text-xs font-bold text-red-600 uppercase">{g.category}</p>
                    <p className="text-xs text-slate-600 mt-1">Priority: {g.priority}</p>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
}