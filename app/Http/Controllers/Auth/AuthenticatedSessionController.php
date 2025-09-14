<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;

class AuthenticatedSessionController extends Controller
{
    public function create()
    {
        return inertia('Auth/Login');
    }

    public function store(Request $request)
{
    $credentials = $request->validate([
        'email'    => ['required','email'],
        'password' => ['required'],
    ]);

    // Always NO remember
    if (! Auth::attempt($credentials, false)) {
        return back()->withErrors(['email' => 'Invalid credentials.'])->onlyInput('email');
    }

    $request->session()->regenerate();

    // Kill any old remember cookie
    Cookie::queue(Cookie::forget(Auth::getRecallerName()));

    return redirect()->intended(route('home'));
}

public function destroy(Request $request)
{
    Auth::logout();

    Cookie::queue(Cookie::forget(Auth::getRecallerName()));

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect()->route('login');
}
}
