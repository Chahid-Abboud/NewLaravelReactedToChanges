<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PlacesApiController extends Controller
{
    /**
     * GET /api/places?lat=33.8938&lng=35.5018&radius=1500&types=gym,nutritionist
     * Returns GeoJSON FeatureCollection of POIs (Foursquare + Overpass).
     */
    public function index(Request $request)
    {
        $lat = (float) $request->query('lat');
        $lng = (float) $request->query('lng');
        $radius = (int) ($request->query('radius', 1500)); // meters
        $types = explode(',', (string) $request->query('types', 'gym,nutritionist'));

        if (!$lat || !$lng) {
            return response()->json([
                'type' => 'FeatureCollection',
                'features' => [],
                'error' => 'lat & lng are required'
            ], 400);
        }

        $features = [];

        // --- 1) FOURSQUARE (primary) ---
        // Query per type because "query" string works better than category IDs in many countries.
        $fsqKey = config('services.foursquare.api_key') ?? env('FOURSQUARE_API_KEY');
        if ($fsqKey) {
            foreach ($types as $q) {
                $q = trim($q);
                if ($q === '') continue;

                $res = Http::withHeaders([
                    'Authorization' => $fsqKey,
                    'Accept' => 'application/json',
                ])->get('https://api.foursquare.com/v3/places/search', [
                    'll' => "{$lat},{$lng}",
                    'radius' => min($radius, 100000), // FSQ allows big radius; we keep requested
                    'query' => $q,
                    'limit' => 50,                     // enough for a student project
                    'sort' => 'DISTANCE',
                ]);

                if ($res->ok()) {
                    foreach ($res->json('results', []) as $p) {
                        $coords = $p['geocodes']['main'] ?? $p['geocodes']['roof'] ?? null;
                        if (!$coords || !isset($coords['longitude'], $coords['latitude'])) continue;

                        $features[] = [
                            'type' => 'Feature',
                            'geometry' => [
                                'type' => 'Point',
                                'coordinates' => [
                                    (float) $coords['longitude'],
                                    (float) $coords['latitude'],
                                ],
                            ],
                            'properties' => [
                                'source' => 'foursquare',
                                'name' => $p['name'] ?? $q,
                                'category' => $q,
                                'distance_m' => $p['distance'] ?? null,
                                'fsq_id' => $p['fsq_id'] ?? null,
                                'address' => $p['location']['formatted_address'] ?? null,
                                'website' => $p['website'] ?? null,
                            ],
                        ];
                    }
                }
            }
        }

        // --- 2) OVERPASS (fallback) ---
        // Use "around" queries in meters around user location.
        // Fitness centers / gyms
        $overpassQueries = [
            'fitness' => '
                (
                    node(around:%d,%f,%f)["amenity"="fitness_centre"];
                    node(around:%d,%f,%f)["leisure"="fitness_centre"];
                    node(around:%d,%f,%f)["sport"="fitness"];
                    way(around:%d,%f,%f)["amenity"="fitness_centre"];
                    way(around:%d,%f,%f)["leisure"="fitness_centre"];
                    relation(around:%d,%f,%f)["amenity"="fitness_centre"];
                );',
            // Nutritionist / dietitian clinics
            'nutrition' => '
                (
                    node(around:%d,%f,%f)["healthcare"="dietitian"];
                    node(around:%d,%f,%f)["dietitian"="yes"];
                    node(around:%d,%f,%f)["healthcare:speciality"~"nutrition"];
                    way(around:%d,%f,%f)["healthcare"="dietitian"];
                    relation(around:%d,%f,%f)["healthcare"="dietitian"];
                );',
        ];

        $selectedBlocks = [];
        if (in_array('gym', $types, true)) {
            $selectedBlocks[] = sprintf($overpassQueries['fitness'], $radius, $lat, $lng, $radius, $lat, $lng, $radius, $lat, $lng, $radius, $lat, $lng, $radius, $lat, $lng);
        }
        if (in_array('nutritionist', $types, true)) {
            $selectedBlocks[] = sprintf($overpassQueries['nutrition'], $radius, $lat, $lng, $radius, $lat, $lng, $radius, $lat, $lng, $radius, $lat, $lng, $radius, $lat, $lng);
        }

        if (!empty($selectedBlocks)) {
            $overpassQuery = '[out:json][timeout:25];' . implode("\n", $selectedBlocks) . ' out center;';
            // Try a couple of public Overpass mirrors
            $endpoints = [
                'https://overpass.kumi.systems/api/interpreter',
                'https://overpass.openstreetmap.fr/api/interpreter',
                'https://overpass-api.de/api/interpreter',
            ];

            $overpassJson = null;
            foreach ($endpoints as $ep) {
                try {
                    $res = Http::timeout(30)->asForm()->post($ep, ['data' => $overpassQuery]);
                    if ($res->ok() && isset($res['elements'])) {
                        $overpassJson = $res->json();
                        break;
                    }
                } catch (\Throwable $e) {
                    // try next
                }
            }

            if ($overpassJson && !empty($overpassJson['elements'])) {
                foreach ($overpassJson['elements'] as $el) {
                    // Get center for ways and relations; nodes have lat/lon
                    $lngLat = null;
                    if (isset($el['lon'], $el['lat'])) {
                        $lngLat = [(float) $el['lon'], (float) $el['lat']];
                    } elseif (isset($el['center']['lon'], $el['center']['lat'])) {
                        $lngLat = [(float) $el['center']['lon'], (float) $el['center']['lat']];
                    }
                    if (!$lngLat) continue;

                    $tags = $el['tags'] ?? [];
                    $name = $tags['name'] ?? ($tags['brand'] ?? 'Unnamed');
                    $cat  = isset($tags['healthcare']) && $tags['healthcare'] === 'dietitian' ? 'nutritionist' : 'gym';

                    $features[] = [
                        'type' => 'Feature',
                        'geometry' => ['type' => 'Point', 'coordinates' => $lngLat],
                        'properties' => [
                            'source' => 'overpass',
                            'name' => $name,
                            'category' => $cat,
                            'osm_id' => $el['id'] ?? null,
                            'address' => $tags['addr:full'] ?? null,
                            'website' => $tags['website'] ?? null,
                        ],
                    ];
                }
            }
        }

        // --- 3) Deduplicate by coordinate+name (simple)
        $seen = [];
        $deduped = [];
        foreach ($features as $f) {
            $k = implode('|', [
                strtolower($f['properties']['name'] ?? ''),
                $f['geometry']['coordinates'][0] ?? '',
                $f['geometry']['coordinates'][1] ?? '',
            ]);
            if (isset($seen[$k])) continue;
            $seen[$k] = true;
            $deduped[] = $f;
        }

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $deduped,
        ]);
    }
}
