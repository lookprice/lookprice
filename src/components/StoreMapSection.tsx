import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Store, StoreLocation } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin } from 'lucide-react';

interface StoreMapSectionProps {
  store: Store;
}

export const StoreMapSection: React.FC<StoreMapSectionProps> = ({ store }) => {
  const { lang } = useLanguage();
  const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
  
  // Combine store main address with other locations if they have coordinates
  const mapLocations: StoreLocation[] = [];
  
  // Check main store address
  if ((store as any).latitude && (store as any).longitude) {
    mapLocations.push({
      name: store.name,
      address: store.address,
      lat: Number((store as any).latitude),
      lng: Number((store as any).longitude),
      active: true
    });
  }
  
  // Add other locations
  if (store.locations && store.locations.length > 0) {
    store.locations.forEach(loc => {
      if (loc.lat && loc.lng) {
        mapLocations.push(loc);
      }
    });
  }

  if (mapLocations.length === 0 || !apiKey) return null;

  // Calculate center
  const center = {
    lat: mapLocations[0].lat!,
    lng: mapLocations[0].lng!
  };

  return (
    <div className="w-full space-y-8 py-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100 mb-2">
           <MapPin className="w-6 h-6" />
        </div>
        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
          {lang === 'tr' ? 'KONUMUMUZ' : 'OUR LOCATION'}
        </h3>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest max-w-lg mx-auto">
          {lang === 'tr' 
            ? 'Bize fiziksel mağazalarımızda ulaşabilir, yerinde inceleme yapabilirsiniz.' 
            : 'Visit us at our physical locations for on-site inspection and consultations.'}
        </p>
      </div>

      <div className="h-[450px] w-full rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl relative z-10 bg-slate-100">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={13}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
            mapId="STORE_LOCATION_MAP"
          >
            {mapLocations.map((loc, idx) => (
              <AdvancedMarker
                key={idx}
                position={{ lat: loc.lat!, lng: loc.lng! }}
                title={loc.name}
              >
                <Pin background={'#f59e0b'} glyphColor={'#fff'} borderColor={'#b45309'} />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mapLocations.map((loc, idx) => (
          <div key={idx} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-black text-slate-900 uppercase tracking-tight mb-2">{loc.name}</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{loc.address}</p>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors"
            >
              {lang === 'tr' ? 'YOL TARİFİ AL' : 'GET DIRECTIONS'}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
