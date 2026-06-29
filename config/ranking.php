<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Tuition post "Best Matches" weights
    |--------------------------------------------------------------------------
    |
    | Relative point weights used to score published tuition posts against a
    | logged-in tutor's profile for the "Best Matches for you" shelf on the
    | tuition jobs page. Tune these without touching the controller.
    |
    */

    'weights' => [
        'location_full' => 30,     // post is in one of the tutor's preferred subdistricts
        'location_district' => 15, // post is only in the same district as a preferred area
        'subject' => 10,           // per matching subject, capped at 3 matches (max 30)
        'class' => 12,             // a student's class_level is teachable by the tutor
        'level' => 8,              // a student's academic_level is teachable by the tutor
        'group' => 5,              // a student's academic_group is teachable by the tutor
        'medium' => 10,            // a student's medium is teachable by the tutor
    ],

    // Max number of cards shown in the "Best Matches for you" shelf.
    'best_matches_limit' => 6,

    /*
    |--------------------------------------------------------------------------
    | Find Tutors "Recommended for you" weights
    |--------------------------------------------------------------------------
    |
    | Relative point weights used to rank tutors against a logged-in guardian's
    | aggregated tuition-post context (their areas, subjects, and class needs)
    | on the find-tutors page.
    |
    */

    'tutor_weights' => [
        'location_full' => 30,     // tutor prefers one of the guardian's post subdistricts
        'location_district' => 15, // tutor only prefers the same district as the guardian
        'subject' => 10,           // per matching subject, capped at 3 matches (max 30)
        'class' => 12,             // tutor teaches a class level the guardian needs
        'group' => 5,              // tutor teaches an academic group the guardian needs
        'medium' => 8,             // tutor teaches a medium the guardian needs
        'verified' => 5,           // small quality boost for verified tutors
    ],
];
