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

// Comprehensive latitude-longitude centers for Northern Cyprus (KKTC) regions/districts
const REGION_COOCDINATES: Record<string, { lat: number; lng: number }> = {
  "alsancak": { lat: 35.3444, lng: 33.2294 },
  "lapta": { lat: 35.3421, lng: 33.1517 },
  "karsiyaka": { lat: 35.3522, lng: 33.0560 },
  "karşıyaka": { lat: 35.3522, lng: 33.0560 },
  "esentepe": { lat: 35.3422, lng: 33.5786 },
  "catalkoy": { lat: 35.3283, lng: 33.3853 },
  "çatalköy": { lat: 35.3283, lng: 33.3853 },
  "bellapais": { lat: 35.2974, lng: 33.3441 },
  "zeytinlik": { lat: 35.3278, lng: 33.3083 },
  "karaoglanoglu": { lat: 35.3365, lng: 33.2847 },
  "karaoğlanoğlu": { lat: 35.3365, lng: 33.2847 },
  "ozankoy": { lat: 35.3256, lng: 33.3592 },
  "ozanköy": { lat: 35.3256, lng: 33.3592 },
  "karaman": { lat: 35.3121, lng: 33.2657 },
  "temblos": { lat: 35.3121, lng: 33.2657 },
  "gonyeli": { lat: 35.2105, lng: 33.3175 },
  "gönyeli": { lat: 35.2105, lng: 33.3175 },
  "hamitkoy": { lat: 35.2091, lng: 33.3934 },
  "hamitköy": { lat: 35.2091, lng: 33.3934 },
  "ortakoy": { lat: 35.1972, lng: 33.3465 },
  "ortaköy": { lat: 35.1972, lng: 33.3465 },
  "yenisehir": { lat: 35.1834, lng: 33.3695 },
  "yenişehir": { lat: 35.1834, lng: 33.3695 },
  "yenibogazici": { lat: 35.1979, lng: 33.8966 },
  "yeniboğaziçi": { lat: 35.1979, lng: 33.8966 },
  "tuzla": { lat: 35.1584, lng: 33.9056 },
  "maras": { lat: 35.1090, lng: 33.9580 },
  "maraş": { lat: 35.1090, lng: 33.9580 },
  "long beach": { lat: 35.2750, lng: 33.9100 },
  "bafra": { lat: 35.3564, lng: 34.0044 },
  "otuken": { lat: 35.2104, lng: 33.8943 },
  "ötüken": { lat: 35.2104, lng: 33.8943 },
  "bogaz": { lat: 35.2950, lng: 33.9450 },
  "boğaz": { lat: 35.2950, lng: 33.9450 },
  "lefke": { lat: 35.1119, lng: 32.8494 },
  "gemikonagi": { lat: 35.1415, lng: 32.8250 },
  "gemikoonağı": { lat: 35.1415, lng: 32.8250 },
  "dipkarpaz": { lat: 35.5975, lng: 34.3780 },
  "yenierenkoy": { lat: 35.5348, lng: 34.1843 },
  "yenierenköy": { lat: 35.5348, lng: 34.1843 },
  "karpaz": { lat: 35.5348, lng: 34.1843 },
  "guzelyurt": { lat: 35.1997, lng: 32.9975 },
  "güzelyurt": { lat: 35.1997, lng: 32.9975 },
  "morphou": { lat: 35.1997, lng: 32.9975 },
  "iskele": { lat: 35.2902, lng: 33.8912 },
  "trikomo": { lat: 35.2902, lng: 33.8912 },
  "magusa": { lat: 35.1250, lng: 33.9312 },
  "mağusa": { lat: 35.1250, lng: 33.9312 },
  "famagusta": { lat: 35.1250, lng: 33.9312 },
  "gazimagusa": { lat: 35.1250, lng: 33.9312 },
  "gazimağusa": { lat: 35.1250, lng: 33.9312 },
  "girne": { lat: 35.3364, lng: 33.3174 },
  "kyrenia": { lat: 35.3364, lng: 33.3174 },
  "lefkosa": { lat: 35.1856, lng: 33.3820 },
  "lefkoşa": { lat: 35.1856, lng: 33.3820 },
  "nicosia": { lat: 35.1856, lng: 33.3820 }
};

const findCoordsForText = (text?: string): { lat: number; lng: number } | null => {
  if (!text) return null;
  const clean = text.toLowerCase().trim();
  for (const [key, coords] of Object.entries(REGION_COOCDINATES)) {
    if (clean.includes(key)) {
      return coords;
    }
  }
  return null;
};

export const PropertyMapTour: React.FC<PropertyMapTourProps> = ({ location: locStr, property, lang }) => {
  const isTr = lang === "tr";

  // Check coordinates from property if available, otherwise do dynamic lookup, fallback to Girne/Kyrenia default
  const position = useMemo(() => {
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

    // Attempt intelligent textual mapping based on location, sector region definitions, or property name contents
    const textSources = [
      locStr,
      property.location,
      (property as any).sector_data?.kktc_region,
      (property as any).sector_data?.region,
      (property as any).sector_data?.district,
      property.name
    ];

    for (const text of textSources) {
      const matched = findCoordsForText(text);
      if (matched) return matched;
    }

    return { lat: 35.3364, lng: 33.3174 }; // Default Girne coordinates
  }, [property, locStr]);

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

  // Beautiful plain and simple 2D Map implementation with valid fallback Map ID and non-overlapping responsive info badge
  return (
    <div className="flex-1 w-full relative flex flex-col min-h-[350px] bg-slate-100 overflow-hidden text-slate-800 rounded-2xl border border-slate-200">
      <APIProvider apiKey={MAP_KEY}>
        <div className="w-full h-full relative" style={{ minHeight: "350px", flex: 1 }}>
          <Map
            mapId="DEMO_MAP_ID"
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

          {/* Repositioned Static Information Badge (Moved to top-24 to prevent overlap with top-6 absolute share buttons) */}
          <div className="absolute top-24 left-4 z-10 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200 shadow-md max-w-xs">
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
