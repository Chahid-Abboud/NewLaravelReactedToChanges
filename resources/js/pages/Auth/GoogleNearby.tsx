// resources/js/Pages/GoogleNearby.tsx
import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function GoogleNearby() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY as string, // put key in .env
      version: 'weekly',
      libraries: ['places'],
    });

    (async () => {
      const { Map } = await loader.importLibrary('maps');
      const center = { lat: 33.893, lng: 35.501 };

      const map = new Map(ref.current!, {
        center, zoom: 15, mapId: 'DEMO_MAP_ID', // optional mapId
      });

      const service = new google.maps.places.PlacesService(map);
      const info = new google.maps.InfoWindow();

      service.nearbySearch(
        { location: center, radius: 800, type: 'cafe' }, // change 'type' as you wish
        (results, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !results) return;
          results.forEach(place => {
            if (!place.geometry?.location) return;
            const m = new google.maps.Marker({ map, position: place.geometry.location, title: place.name });
            m.addListener('click', () => {
              info.setContent(`<strong>${place.name ?? ''}</strong><br/>${place.vicinity ?? ''}`);
              info.open(map, m);
            });
          });
        }
      );
    })();
  }, []);

  return <div ref={ref} style={{ height: '100vh', width: '100%' }} />;
}
