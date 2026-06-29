<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\TuitionPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SavedTuitionPostController extends Controller
{
    public function store(Request $request, TuitionPost $tuitionPost): RedirectResponse
    {
        abort_unless($request->user()->role === 'tutor', 403);

        $request->user()->savedTuitionPosts()->syncWithoutDetaching([$tuitionPost->id]);

        return back();
    }

    public function destroy(Request $request, TuitionPost $tuitionPost): RedirectResponse
    {
        abort_unless($request->user()->role === 'tutor', 403);

        $request->user()->savedTuitionPosts()->detach($tuitionPost->id);

        return back();
    }
}
