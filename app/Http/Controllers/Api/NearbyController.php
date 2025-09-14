<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class NearbyController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'lat' => ['required','numeric','between:-90,90'],
            'lon' => ['required','numeric','between:-180,180'],
            'radius' => ['nullable','integer','min:200','max:5000'],
        ]);

        $lat = (float) $validated['lat'];
        $lon = (float) $validated['lon'];
        $radius = (int) ($validated['radius'] ?? 1500);

        $query = <<<OVERPASS
[out:json][timeout:25];
(
  node(around:$radius,$lat,$lon)[leisure=fitness_centre];
  node(around:$radius,$lat,$lon)[amenity=fitness_centre];

  node(around:$radius,$lat,$lon)[healthcare=nutritionist];
  node(around:$radius,$lat,$lon)[office=dietitian];
);
out body;
>; out skel qt;
OVERPASS;

        $endpoints = [
            'https://overpass.kumi.systems/api/interpreter',
            'https://overpass-api.de/api/interpreter',
        ];

        foreach ($endpoints as $ep) {
            try {
                $resp = Http::timeout(25)->asForm()->post($ep, ['data' => $query]);
                if ($resp->ok()) {
                    $data = $resp->json();
                    $items = [];
                    foreach ($data['elements'] ?? [] as $el) {
                        if (($el['type'] ?? '') !== 'node') continue;
                        $tags = $el['tags'] ?? [];
                        $isGym = ($tags['leisure'] ?? null) === 'fitness_centre'
                              || ($tags['amenity'] ?? null) === 'fitness_centre';
                        $isNut = ($tags['healthcare'] ?? null) === 'nutritionist'
                              || ($tags['office'] ?? null) === 'dietitian';
                        if (!$isGym && !$isNut) continue;

                        $items[] = [
                            'id' => $el['id'],
                            'type' => $isGym ? 'gym' : 'nutritionist',
                            'name' => $tags['name'] ?? null,
                            'lat' => $el['lat'],
                            'lon' => $el['lon'],
                            'tags' => $tags,
                        ];
                    }

                    return response()->json([
                        'center' => ['lat' => $lat, 'lon' => $lon],
                        'radius' => $radius,
                        'results' => $items,
                    ]);
                }
                Log::warning('Overpass non-OK', ['endpoint' => $ep, 'status' => $resp->status()]);
            } catch (\Throwable $e) {
                Log::error('Overpass error', ['endpoint' => $ep, 'error' => $e->getMessage()]);
            }
        }

        $message = app()->isLocal()
            ? 'Upstream Overpass failed or rate-limited. Check storage/logs/laravel.log.'
            : 'Unable to fetch nearby places at the moment.';

        return response()->json(['error' => $message], 502);
    }
}
