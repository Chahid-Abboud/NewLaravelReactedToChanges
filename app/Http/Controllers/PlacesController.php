<?php

namespace App\Http\Controllers;

use App\Services\OverpassService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class PlacesController extends Controller
{
    public function index(Request $request, OverpassService $overpass)
    {
        // Throttle by IP to avoid hammering Overpass on pan/zoom
        $key = 'overpass:'. $request->ip();
        if (RateLimiter::tooManyAttempts($key, 20)) { // 20 requests per minute
            return response()->json(['message' => 'Slow down'], 429);
        }
        RateLimiter::hit($key, 60);

        $bbox = $this->parseBbox($request->query('bbox'));
        $filters = $request->query('filters', []); // pass through from UI

        try {
            $data = $overpass->fetchPlaces($bbox, $filters);
            return response()->json($data);
        } catch (\Throwable $e) {
            // Log and return a soft error (your React can show a toast and keep old pins)
            logger()->warning('Overpass failed', ['err' => $e->getMessage()]);
            return response()->json([
                'message' => 'Nearby places are temporarily unavailable. Please zoom in or try again.'
            ], Response::HTTP_BAD_GATEWAY);
        }
    }

    private function parseBbox(?string $bboxStr): array
    {
        // Expected "south,west,north,east"
        $parts = array_map('trim', explode(',', (string) $bboxStr));
        if (count($parts) !== 4) {
            abort(422, 'Invalid bbox');
        }
        // Sanity-limit the extent (e.g., max ~0.5° span) to keep queries fast
        [$s,$w,$n,$e] = $parts;
        if (($n - $s) > 0.5 || ($e - $w) > 0.5) {
            abort(422, 'Bounding box too large—zoom in further');
        }
        return [$s,$w,$n,$e];
    }
}
