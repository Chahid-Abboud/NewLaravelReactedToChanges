<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlacesApiController extends Controller
{
    /**
     * GET /api/places?lat=33.8938&lng=35.5018&radius=1500&types=gym,nutritionist
     *
     * Returns a GeoJSON FeatureCollection of nearby places (from your DB).
     * Assumes a table named `places_local` with columns:
     *  - name (string)
     *  - category (enum/string: 'gym' or 'nutritionist')
     *  - lat (float)
     *  - lng (float)
     *  - address (nullable string)
     *  - city (nullable string)
     *  - website (nullable string)
     */
    public function index(Request $request)
    {
        $lat = (float) $request->query('lat');
        $lng = (float) $request->query('lng');
        $radius = (int) $request->query('radius', 1500); // meters
        $typesCsv = trim((string) $request->query('types', 'gym,nutritionist'));
        $types = array_values(array_filter(array_map('trim', explode(',', $typesCsv))));

        // Basic validation
        if (!$lat || !$lng) {
            return response()->json([
                'type' => 'FeatureCollection',
                'features' => [],
                'error' => 'lat & lng are required',
            ], 400);
        }
        if (empty($types)) {
            $types = ['gym', 'nutritionist'];
        }

        // Defensive clamp on radius (1.5km default is fine; cap to 20km)
        $radius = max(1, min($radius, 20_000));

        // --- Distance math (Haversine) ---
        // Earth radius in meters
        $earthRadius = 6371000;

        // Optional coarse bounding box to reduce scanned rows before precise distance
        // (roughly valid for small distances)
        $degLat = $radius / 111_320; // meters per degree latitude ~111.32km
        $degLng = $radius / (111_320 * max(0.000001, cos(deg2rad($lat)))); // protect against cos(±90°)

        $minLat = $lat - $degLat;
        $maxLat = $lat + $degLat;
        $minLng = $lng - $degLng;
        $maxLng = $lng + $degLng;

        // Build query:
        // - Select fields + computed distance_m (Haversine)
        // - Filter by category + coarse bbox
        // - HAVING distance_m <= radius (precise filter)
        // - Order by distance
        // NOTE: We use parameter bindings for the raw expression.
        $rows = DB::table('places_local')
            ->select([
                'name',
                'category',
                'lat',
                'lng',
                'address',
                'city',
                'website',
                DB::raw(sprintf(
                    // Haversine formula in SQL, returns meters
                    '%d * 2 * ASIN(SQRT(POWER(SIN(RADIANS(lat - ?)/2),2) + COS(RADIANS(?)) * COS(RADIANS(lat)) * POWER(SIN(RADIANS(lng - ?)/2),2))) AS distance_m',
                    $earthRadius
                )),
            ])
            ->whereIn('category', $types)
            ->whereBetween('lat', [$minLat, $maxLat])
            ->whereBetween('lng', [$minLng, $maxLng])
            ->having('distance_m', '<=', $radius)
            ->orderBy('distance_m', 'asc')
            ->limit(200)
            // Bindings for the 3 placeholders in the Haversine expression: (lat, lat, lng)
            ->setBindings([$lat, $lat, $lng], 'select')
            ->get();

        // Map to GeoJSON features
        $features = $rows->map(function ($r) {
            return [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [(float) $r->lng, (float) $r->lat],
                ],
                'properties' => [
                    'source'     => 'db',
                    'name'       => $r->name,
                    'category'   => $r->category,
                    'address'    => $r->address,
                    'city'       => $r->city,
                    'website'    => $r->website,
                    'distance_m' => (int) round($r->distance_m),
                ],
            ];
        })->values()->all();

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features,
        ]);
    }
}
