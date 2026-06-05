import { locations } from '@/app/data/mockData';
import { MapPin, Phone, Clock } from 'lucide-react';

export function StoreLocatorPage() {
  return (
    <div className="pt-14 min-h-screen">
      <div className="py-12 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl mb-3 tracking-tight">Store Locator</h1>
        <p className="text-neutral-600 mb-12">
          Visit us at one of our showrooms
        </p>

        <div className="space-y-6">
          {locations.map(location => (
            <div key={location.id} className="border border-neutral-200 p-6">
              <h2 className="text-2xl mb-6 tracking-tight">{location.name}</h2>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-700">{location.address}</p>
                    <p className="text-sm text-neutral-700">{location.city}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <a href={`tel:${location.phone}`} className="text-sm text-neutral-700 hover:underline">
                    {location.phone}
                  </a>
                </div>

                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-neutral-700">{location.hours}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-200">
                <button className="bg-black text-white px-6 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors">
                  GET DIRECTIONS
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
