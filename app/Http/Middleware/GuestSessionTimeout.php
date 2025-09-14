<?php 
// app/Http/Middleware/GuestSessionTimeout.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class GuestSessionTimeout {
    public function handle(Request $request, Closure $next) {
        if (session('guest')) {
            $started = (int) session('guest_started_at', 0);
            $maxAge = 60 * 60; // 60 minutes
            if ($started && (time() - $started) > $maxAge) {
                session()->invalidate();
                session()->regenerateToken();
                return redirect()->route('landing')
                    ->with('status', 'Guest session expired. Please continue as guest again or sign in.');
            }
        }
        return $next($request);
    }
}
