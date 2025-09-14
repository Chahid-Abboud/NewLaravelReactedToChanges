<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;

class ForbidRememberMe
{
    public function handle(Request $request, Closure $next)
    {
        // Name of the "remember me" cookie, e.g. remember_web_xxx
        $recaller = Auth::getRecallerName();

        // Remove the cookie from THIS request so RedirectIfAuthenticated can't auto-login now
        if ($request->cookies->has($recaller)) {
            $request->cookies->remove($recaller);
            // And drop it for future requests
            Cookie::queue(Cookie::forget($recaller));
        }

        return $next($request);
    }
}
