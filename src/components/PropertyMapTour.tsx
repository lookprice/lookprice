import React, { useMemo } from "react";
import { MapPin } from "lucide-react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { Product } from "../types";

const MAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || "";

interface PropertyMapTourProps {
  location?: string;
  property: Product;
  lang: string;
}

export const PropertyMapTour: React.FC<PropertyMapTourProps> = ({ location: locStr, property, lang }) => {
  const isTr = lang === "tr";

  // Check coordinates from property if available, otherwise fallback to Girne/Kyrenia default
  const position = useMemo(() => {
    // If property has lat/lng coordinates (e.g. coordinates: "35.334,33.315")
    const coordsStr = (property as any).coordinates || (property as any).location_coords;
    if (coordsStr && typeof coordsStr === "string") {
      const parts = coordsStr.split(",");
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    return { lat: 35.334, lng: 33.315 }; // Default Girne coordinates
  }, [property]);

  if (!MAP_KEY) {
    return (
      <div className="w-full h-full bg-slate-50 flex items-center justify-center p-8 text-center border rounded-2xl">
        <div className="max-w-xs">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-semibold">
            {isTr 
              ? "Harita verisi için GOOGLE_MAPS_PLATFORM_KEY gereklidir." 
              : "GOOGLE_MAPS_PLATFORM_KEY is required for map data."}
          </p>
          {locStr && (
            <p className="text-xs text-slate-400 mt-2 font-mono bg-slate-100 py-1 px-2 rounded-lg">
              {locStr}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Beautiful plain and simple 2D Map implementation
  return (
    <div className="flex-1 w-full relative flex flex-col min-h-[350px] bg-slate-100 overflow-hidden text-slate-800 rounded-2xl border border-slate-200">
      <APIProvider apiKey={MAP_KEY}>
        <div className="w-full h-full relative" style={{ minHeight: "350px", flex: 1 }}>
          <Map
            defaultCenter={position}
            defaultZoom={13}
            gestureHandling={"cooperative"}
            disableDefaultUI={false}
          >
            <AdvancedMarker position={position}>
              <div className="bg-rose-500 text-white p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center animate-bounce">
                <MapPin className="w-5 h-5 fill-white text-rose-500" />
              </div>
            </AdvancedMarker>
          </Map>

          {/* Simple Static Information Badge */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200 shadow-md max-w-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {isTr ? "MÜLK KONUMU" : "PROPERTY LOCATION"}
                </p>
                <p className="text-xs font-bold text-slate-800 leading-tight mt-0.5">
                  {locStr || (isTr ? "Girne, KKTC" : "Kyrenia, North Cyprus")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </APIProvider>
    </div>
  );
};
