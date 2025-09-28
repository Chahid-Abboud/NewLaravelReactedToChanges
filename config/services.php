<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

'overpass' => [
    'endpoint'       => env('OVERPASS_ENDPOINT', 'https://overpass-api.de/api/interpreter'),
    'timeout'        => (int) env('OVERPASS_TIMEOUT', 20),
    'retries'        => (int) env('OVERPASS_RETRIES', 4),
    'retry_delay_ms' => (int) env('OVERPASS_RETRY_DELAY_MS', 1800),
    'cache_ttl'      => (int) env('OVERPASS_CACHE_TTL_SECONDS', 21600),

    // SSL helpers
    'ca_path'        => env('CURL_CA_BUNDLE', ''),  // e.g. C:\wamp64\bin\php\php8.3.6\extras\ssl\cacert.pem
    'skip_verify'    => (bool) env('OVERPASS_SKIP_SSL_VERIFY', false),

    'user_agent'     => env('OVERPASS_USER_AGENT', 'Hayetak/1.0 (+contact)'),
],
'mapbox' => [
    // This one is fine to expose in client (public token), but keep it in .env anyway
    'token' => env('VITE_MAPBOX_TOKEN'),
],

'foursquare' => [
    // Keep this private, never expose in React directly
    'api_key' => env('FOURSQUARE_API_KEY'),
],


];
