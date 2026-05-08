<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FindTutorController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'tutor')
            ->whereHas('tutorProfile')
            ->with([
                'tutorProfile.university', 
                'tutorProfile.subjects', 
                'tutorProfile.preferredLocations'
            ]);

        // Filter by gender
        if ($request->filled('gender') && $request->gender !== 'any') {
            $query->where('gender', $request->gender);
        }

        // Filter by location
        if ($request->filled('location')) {
            $location = $request->location;
            $query->whereHas('tutorProfile.preferredLocations', function ($q) use ($location) {
                $q->where('name', 'like', "%{$location}%");
            });
        }

        // Filter by subject
        if ($request->filled('subject')) {
            $subject = $request->subject;
            $query->whereHas('tutorProfile.subjects', function ($q) use ($subject) {
                $q->where('name', 'like', "%{$subject}%");
            });
        }

        // Filter by university
        if ($request->filled('university')) {
            $university = $request->university;
            $query->whereHas('tutorProfile.university', function ($q) use ($university) {
                $q->where('name', 'like', "%{$university}%");
            });
        }

        $tutors = $query->latest()->paginate(12)->withQueryString();

        $universities = \App\Models\University::orderBy('name')->get(['id', 'name']);

        return Inertia::render('FindTutors', [
            'tutors' => $tutors,
            'universities' => $universities,
            'filters' => [
                'location' => $request->location ?? '',
                'subject' => $request->subject ?? '',
                'gender' => $request->gender ?? 'any',
                'university' => $request->university ?? '',
            ]
        ]);
    }
}
