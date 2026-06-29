import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    MapPin,
    Calendar,
    User,
    Search,
    GraduationCap,
    Filter,
    Loader2,
    ChevronDown,
    BookOpen,
    Clock,
    X,
    Sparkles,
    Heart,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    store as savePost,
    destroy as unsavePost,
} from '@/actions/App/Http/Controllers/Tutor/SavedTuitionPostController';
import AutocompleteInput from '@/components/autocomplete-input';
import PublicFooter from '@/components/public-footer';
import PublicNavbar from '@/components/public-navbar';

type Subject = { id: number; name: string };
type Student = {
    id: number;
    academic_level: string;
    class_level: string | null;
    medium: string;
    subjects: Subject[];
};
type MatchReasons = {
    in_area: boolean;
    subjects: number;
    class_match: boolean;
};

type Post = {
    id: number;
    title: string | null;
    district_name: string;
    subdistrict_name: string;
    salary_type: string;
    salary_min: number | null;
    salary_max: number | null;
    days_per_week: number;
    tutor_gender_preference: string;
    published_at: string;
    students: Student[];
    match_reasons?: MatchReasons;
};

type PaginatedPosts = {
    data: Post[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    last_page: number;
};

type T = Record<string, any>;

function str(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function replaceVars(template: string, vars: Record<string, string | number>) {
    return Object.entries(vars).reduce(
        (r, [k, v]) => r.replace(`:${k}`, String(v)),
        template,
    );
}

function salaryLabel(post: Post, t: T) {
    const negotiable = str(t?.tuition_jobs?.salary_negotiable, 'Negotiable');

    if (post.salary_type === 'negotiable') {
        return negotiable;
    }

    if (post.salary_type === 'range' && post.salary_min && post.salary_max) {
        return `৳${post.salary_min.toLocaleString()} - ৳${post.salary_max.toLocaleString()}`;
    }

    if (post.salary_min) {
        return `৳${post.salary_min.toLocaleString()}`;
    }

    return negotiable;
}

function levelLabel(level: string, t: T) {
    return str(t?.card?.levels?.[level], level);
}

function timeAgo(dateStr: string, t: T): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);

    if (diff < 3600) {
        const mins = Math.max(1, Math.floor(diff / 60));

        if (diff < 60) {
            return str(t?.tuition_jobs?.posted_just_now, 'Posted just now');
        }

        return replaceVars(
            str(t?.tuition_jobs?.posted_minutes, 'Posted :count min ago'),
            { count: mins },
        );
    }

    if (diff < 86400) {
        return replaceVars(
            str(t?.tuition_jobs?.posted_hours, 'Posted :count hr ago'),
            { count: Math.floor(diff / 3600) },
        );
    }

    return replaceVars(
        str(t?.tuition_jobs?.posted_days, 'Posted :count days ago'),
        { count: Math.floor(diff / 86400) },
    );
}

function classLabel(value: string | null, t: T) {
    if (!value) {
        return '';
    }

    if (value === 'nursery') {
        return str(t?.card?.class_nursery, 'Nursery');
    }

    if (value === 'kg') {
        return str(t?.card?.class_kg, 'KG');
    }

    return str(t?.card?.class_level, `Class ${value}`).replace(':level', value);
}

function matchReasonLabels(reasons: MatchReasons, t: T): string[] {
    const labels: string[] = [];

    if (reasons.in_area) {
        labels.push(str(t?.tuition_jobs?.reason_in_area, 'In your area'));
    }

    if (reasons.subjects === 1) {
        labels.push(str(t?.tuition_jobs?.reason_subject, 'Matches 1 subject'));
    } else if (reasons.subjects > 1) {
        labels.push(
            replaceVars(
                str(
                    t?.tuition_jobs?.reason_subjects,
                    'Matches :count subjects',
                ),
                { count: reasons.subjects },
            ),
        );
    }

    if (reasons.class_match) {
        labels.push(str(t?.tuition_jobs?.reason_class, 'Teaches this class'));
    }

    return labels;
}

function TuitionCard({
    post,
    t,
    showReasons = false,
    saveable = false,
    saved = false,
    onToggleSave,
}: {
    post: Post;
    t: T;
    showReasons?: boolean;
    saveable?: boolean;
    saved?: boolean;
    onToggleSave?: (post: Post) => void;
}) {
    const reasonLabels =
        showReasons && post.match_reasons
            ? matchReasonLabels(post.match_reasons, t)
            : [];
    const allSubjects = [
        ...new Set(
            post.students.flatMap((s) => s.subjects.map((sub) => sub.name)),
        ),
    ];
    const levels = [
        ...new Set(post.students.map((s) => levelLabel(s.academic_level, t))),
    ];
    const classLevels = [
        ...new Set(
            post.students
                .map((s) => classLabel(s.class_level, t))
                .filter(Boolean),
        ),
    ];

    return (
        <Link
            href={`/tuition-posts/${post.id}`}
            className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 leading-snug font-bold text-slate-900 transition-colors group-hover:text-blue-700">
                    {post.title ||
                        replaceVars(
                            str(
                                t?.card?.default_title,
                                'Tuition in :subdistrict',
                            ),
                            { subdistrict: post.subdistrict_name },
                        )}
                </h3>
                <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        {salaryLabel(post, t)}
                    </span>
                    {saveable && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleSave?.(post);
                            }}
                            aria-pressed={saved}
                            aria-label={
                                saved
                                    ? str(
                                          t?.tuition_jobs?.unsave,
                                          'Remove from saved',
                                      )
                                    : str(t?.tuition_jobs?.save, 'Save job')
                            }
                            title={
                                saved
                                    ? str(
                                          t?.tuition_jobs?.unsave,
                                          'Remove from saved',
                                      )
                                    : str(t?.tuition_jobs?.save, 'Save job')
                            }
                            className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                        >
                            <Heart
                                className={`h-5 w-5 ${saved ? 'fill-rose-500 text-rose-500' : ''}`}
                            />
                        </button>
                    )}
                </div>
            </div>

            {reasonLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {reasonLabels.map((label) => (
                        <span
                            key={label}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700"
                        >
                            <Sparkles className="h-3 w-3" />
                            {label}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {allSubjects.slice(0, 3).map((s) => (
                    <span
                        key={s}
                        className="rounded-md border border-blue-100/50 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                    >
                        {s}
                    </span>
                ))}
                {allSubjects.length > 3 && (
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {replaceVars(
                            str(t?.tuition_jobs?.more_count, '+:count more'),
                            { count: allSubjects.length - 3 },
                        )}
                    </span>
                )}
            </div>

            {classLevels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {classLevels.slice(0, 3).map((label) => (
                        <span
                            key={label}
                            className="rounded-md border border-amber-100/60 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                        >
                            {label}
                        </span>
                    ))}
                    {classLevels.length > 3 && (
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {replaceVars(
                                str(
                                    t?.tuition_jobs?.more_count,
                                    '+:count more',
                                ),
                                { count: classLevels.length - 3 },
                            )}
                        </span>
                    )}
                </div>
            )}

            <div className="mt-auto flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
                <div className="flex w-full items-center gap-1.5 sm:w-auto">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="truncate">
                        {post.subdistrict_name}, {post.district_name}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{levels.join(', ')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>
                        {replaceVars(
                            str(t?.tuition_jobs?.days_week, ':count d/wk'),
                            { count: post.days_per_week },
                        )}
                    </span>
                </div>
                {post.tutor_gender_preference !== 'any' && (
                    <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="capitalize">
                            {replaceVars(
                                str(
                                    t?.tuition_jobs?.tutor_suffix,
                                    ':gender Tutor',
                                ),
                                { gender: post.tutor_gender_preference },
                            )}
                        </span>
                    </div>
                )}
                {post.published_at && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>{timeAgo(post.published_at, t)}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function FilterChip({
    label,
    onRemove,
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
            {label}
            <button
                type="button"
                onClick={onRemove}
                className="rounded-full p-0.5 text-blue-500 transition hover:bg-blue-100 hover:text-blue-700"
                aria-label="Remove filter"
            >
                <X className="h-3 w-3" />
            </button>
        </span>
    );
}

const classOptions = [
    { value: 'nursery', label: 'Nursery' },
    { value: 'kg', label: 'KG' },
    ...Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
    })),
];

const groupOptions = [
    { value: 'science', label: 'Science' },
    { value: 'commerce', label: 'Commerce' },
    { value: 'arts', label: 'Arts' },
];

const academicLevelOptions = [
    { value: 'primary', fallback: 'Primary' },
    { value: 'high_school', fallback: 'High School' },
    { value: 'college', fallback: 'College' },
    { value: 'honors', fallback: 'Honors' },
];

// The classes that belong to each broad academic level. 'honors' has no class.
const classesByLevel: Record<string, string[]> = {
    primary: ['nursery', 'kg', '1', '2', '3', '4', '5'],
    high_school: ['6', '7', '8', '9', '10'],
    college: ['11', '12'],
    honors: [],
};

export default function TuitionJobsPage({
    posts,
    tab = 'recent',
    tabsAvailable = false,
    savedIds = [],
    filters,
    canRegister = true,
}: {
    posts: PaginatedPosts;
    tab?: 'best' | 'recent' | 'saved';
    tabsAvailable?: boolean;
    savedIds?: number[];
    filters: {
        location: string;
        class_level: string;
        academic_group: string;
        gender: string;
        level: string;
        min_salary: number | null;
        max_days: number | null;
    };
    canRegister?: boolean;
}) {
    const { translations: t } = usePage().props as any;
    const [savedSet, setSavedSet] = useState<Set<number>>(
        () => new Set(savedIds),
    );

    const toggleSave = (post: Post) => {
        const isSaved = savedSet.has(post.id);
        setSavedSet((prev) => {
            const next = new Set(prev);

            if (isSaved) {
                next.delete(post.id);
            } else {
                next.add(post.id);
            }

            return next;
        });

        const action = isSaved ? unsavePost(post.id) : savePost(post.id);
        router.visit(action.url, {
            method: action.method,
            preserveScroll: true,
            preserveState: true,
            only: ['posts', 'savedIds'],
        });
    };

    const [location, setLocation] = useState(filters.location ?? '');
    const [classLevel, setClassLevel] = useState(filters.class_level ?? '');
    const [academicGroup, setAcademicGroup] = useState(
        filters.academic_group ?? '',
    );
    const [gender, setGender] = useState(filters.gender ?? 'any');
    const [level, setLevel] = useState(filters.level ?? '');
    const [minSalary, setMinSalary] = useState(
        filters.min_salary ? String(filters.min_salary) : '',
    );
    const [maxDays, setMaxDays] = useState(
        filters.max_days ? String(filters.max_days) : '',
    );
    const [isFiltering, setIsFiltering] = useState(false);

    const shouldShowGroup = ['9', '10', '11', '12'].includes(classLevel);
    // 'honors' students have no class grade, so the Class picker is disabled for them.
    const classDisabled = level === 'honors';
    // Class options cascade from the selected Academic Level; show all when 'Any'.
    const visibleClassOptions =
        level && classesByLevel[level]
            ? classOptions.filter((o) =>
                  classesByLevel[level].includes(o.value),
              )
            : classOptions;

    const onClassChange = (next: string) => {
        setClassLevel(next);

        if (!['9', '10', '11', '12'].includes(next)) {
            setAcademicGroup('');
        }
    };

    const onLevelChange = (next: string) => {
        setLevel(next);

        // Clear the class if it no longer belongs to the chosen level.
        if (next && classLevel && !classesByLevel[next]?.includes(classLevel)) {
            setClassLevel('');
            setAcademicGroup('');
        }
    };

    const navigate = (params: Record<string, string | number | undefined>) => {
        // Always send the active tab explicitly — the server default differs by role,
        // so omitting it (e.g. for 'recent') would bounce an eligible tutor back to 'best'.
        const merged = { tab, ...params };
        router.get('/tuition-jobs', merged, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsFiltering(true),
            onError: () => setIsFiltering(false),
            onFinish: () => setIsFiltering(false),
        });
    };

    const currentFilterParams = (): Record<
        string,
        string | number | undefined
    > => ({
        location: location.trim() || undefined,
        class_level: classLevel || undefined,
        academic_group: shouldShowGroup
            ? academicGroup || undefined
            : undefined,
        gender: gender !== 'any' ? gender : undefined,
        level: level || undefined,
        min_salary: minSalary.trim() || undefined,
        max_days: maxDays.trim() || undefined,
    });

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        navigate(currentFilterParams());
    };

    const selectTab = (nextTab: 'best' | 'recent' | 'saved') => {
        if (nextTab === tab) {
            return;
        }

        navigate({ ...currentFilterParams(), tab: nextTab });
    };

    const resetFilters = () => {
        setLocation('');
        setClassLevel('');
        setAcademicGroup('');
        setGender('any');
        setLevel('');
        setMinSalary('');
        setMaxDays('');
        navigate({});
    };

    const removeFilter = (key: string) => {
        const next: Record<string, string | number | undefined> = {
            location: filters.location || undefined,
            class_level: filters.class_level || undefined,
            academic_group: filters.academic_group || undefined,
            gender:
                filters.gender && filters.gender !== 'any'
                    ? filters.gender
                    : undefined,
            level: filters.level || undefined,
            min_salary: filters.min_salary ?? undefined,
            max_days: filters.max_days ?? undefined,
        };
        delete next[key];

        if (key === 'location') {
            setLocation('');
        }

        if (key === 'class_level') {
            setClassLevel('');
            setAcademicGroup('');
            delete next.academic_group;
        }

        if (key === 'academic_group') {
            setAcademicGroup('');
        }

        if (key === 'gender') {
            setGender('any');
        }

        if (key === 'level') {
            setLevel('');
        }

        if (key === 'min_salary') {
            setMinSalary('');
        }

        if (key === 'max_days') {
            setMaxDays('');
        }

        navigate(next);
    };

    const hasActiveFilters = !!(
        filters.location ||
        filters.class_level ||
        filters.academic_group ||
        (filters.gender && filters.gender !== 'any') ||
        filters.level ||
        filters.min_salary ||
        filters.max_days
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Head
                title={str(
                    t?.tuition_jobs?.page_title,
                    'All Tuition Jobs - Tuition Media',
                )}
            />
            {isFiltering && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/75 backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <p className="text-sm font-semibold text-slate-700">
                            {str(
                                t?.tuition_jobs?.applying_filters,
                                'Applying filters...',
                            )}
                        </p>
                    </div>
                </div>
            )}
            <PublicNavbar canRegister={canRegister} active="tuition-jobs" />

            <div className="border-b border-slate-200 bg-white pt-8 pb-7">
                <div className="mx-auto max-w-7xl px-4 lg:px-8">
                    <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                        {str(t?.tuition_jobs?.heading, 'All Tuition Jobs')}
                    </h1>
                    <p className="mt-2 text-base text-slate-600">
                        {str(
                            t?.tuition_jobs?.subheading,
                            'Browse all available tuition posts with tutor-focused filters.',
                        )}
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
                <div className="flex flex-col gap-8 lg:flex-row">
                    <aside className="w-full shrink-0 lg:w-72">
                        <form
                            onSubmit={onSubmit}
                            className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <Filter className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-slate-900">
                                    {str(
                                        t?.tuition_jobs?.filter_heading,
                                        'Filter Tuition Jobs',
                                    )}
                                </h2>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        {str(
                                            t?.tuition_jobs?.label_location,
                                            'Area / Location',
                                        )}
                                    </label>
                                    <AutocompleteInput
                                        value={location}
                                        onChange={setLocation}
                                        fetchUrl={(q) =>
                                            `/api/locations?q=${encodeURIComponent(q)}`
                                        }
                                        mapLabel={(s) => s.label}
                                        mapValue={(s) => s.name}
                                        placeholder={str(
                                            t?.tuition_jobs
                                                ?.placeholder_location,
                                            'Area or District...',
                                        )}
                                        icon={
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                        }
                                        className="w-full min-w-0 rounded-xl border border-slate-300 px-4 py-2.5 pl-10 text-sm"
                                    />
                                </div>

                                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">
                                            {str(
                                                t?.tuition_jobs
                                                    ?.student_level_heading,
                                                'Student Level',
                                            )}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {str(
                                                t?.tuition_jobs
                                                    ?.student_level_hint,
                                                'Pick a broad level, or narrow to a specific class.',
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            {str(
                                                t?.tuition_jobs?.label_level,
                                                'Academic Level',
                                            )}
                                        </label>
                                        <select
                                            value={level}
                                            onChange={(e) =>
                                                onLevelChange(e.target.value)
                                            }
                                            className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
                                        >
                                            <option value="">
                                                {str(
                                                    t?.tuition_jobs?.any_level,
                                                    'Any Academic Level',
                                                )}
                                            </option>
                                            {academicLevelOptions.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {str(
                                                            t?.card?.levels?.[
                                                                option.value
                                                            ],
                                                            option.fallback,
                                                        )}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            {str(
                                                t?.tuition_jobs?.label_class,
                                                'Class',
                                            )}
                                        </label>
                                        <div className="relative">
                                            <GraduationCap className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <select
                                                value={classLevel}
                                                onChange={(e) =>
                                                    onClassChange(
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={classDisabled}
                                                className="w-full min-w-0 appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 pl-10 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                            >
                                                <option value="">
                                                    {str(
                                                        t?.tuition_jobs
                                                            ?.placeholder_class,
                                                        'Select Class',
                                                    )}
                                                </option>
                                                {visibleClassOptions.map(
                                                    (option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            {str(
                                                t?.tuition_jobs?.label_group,
                                                'Academic Group',
                                            )}
                                        </label>
                                        <div className="relative">
                                            <BookOpen className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <select
                                                value={academicGroup}
                                                onChange={(e) =>
                                                    setAcademicGroup(
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={!shouldShowGroup}
                                                className="w-full min-w-0 appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 pl-10 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                            >
                                                <option value="">
                                                    {shouldShowGroup
                                                        ? str(
                                                              t?.tuition_jobs
                                                                  ?.placeholder_group,
                                                              'Select Group',
                                                          )
                                                        : str(
                                                              t?.tuition_jobs
                                                                  ?.group_disabled_hint,
                                                              'Select Group (class 9-12 only)',
                                                          )}
                                                </option>
                                                {groupOptions.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        {str(
                                            t?.tuition_jobs?.label_gender,
                                            'Tutor Gender Preference',
                                        )}
                                    </label>
                                    <select
                                        value={gender}
                                        onChange={(e) =>
                                            setGender(e.target.value)
                                        }
                                        className="w-full min-w-0 rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                                    >
                                        <option value="any">
                                            {str(
                                                t?.tuition_jobs?.any_gender,
                                                'Any Tutor Gender',
                                            )}
                                        </option>
                                        <option value="male">
                                            {str(
                                                t?.tuition_jobs?.male_tutor,
                                                'Male Tutor',
                                            )}
                                        </option>
                                        <option value="female">
                                            {str(
                                                t?.tuition_jobs?.female_tutor,
                                                'Female Tutor',
                                            )}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        {str(
                                            t?.tuition_jobs?.label_min_salary,
                                            'Minimum Budget',
                                        )}
                                    </label>
                                    <input
                                        value={minSalary}
                                        onChange={(e) =>
                                            setMinSalary(e.target.value)
                                        }
                                        placeholder={str(
                                            t?.tuition_jobs
                                                ?.placeholder_min_salary,
                                            'Minimum Budget (BDT)',
                                        )}
                                        type="number"
                                        min={0}
                                        className="w-full min-w-0 rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        {str(
                                            t?.tuition_jobs?.label_max_days,
                                            'Max Days / Week',
                                        )}
                                    </label>
                                    <input
                                        value={maxDays}
                                        onChange={(e) =>
                                            setMaxDays(e.target.value)
                                        }
                                        placeholder={str(
                                            t?.tuition_jobs
                                                ?.placeholder_max_days,
                                            'Max Days/Week',
                                        )}
                                        type="number"
                                        min={1}
                                        max={7}
                                        className="w-full min-w-0 rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isFiltering}
                                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {str(t?.tuition_jobs?.apply, 'Apply')}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    disabled={!hasActiveFilters}
                                    className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {str(t?.tuition_jobs?.reset, 'Reset')}
                                </button>
                            </div>
                        </form>
                    </aside>

                    <main className="min-w-0 flex-1">
                        {tabsAvailable && (
                            <div className="mb-6 flex gap-1 border-b border-slate-200">
                                {(
                                    [
                                        [
                                            'best',
                                            t?.tuition_jobs?.tab_best,
                                            'Best matches',
                                        ],
                                        [
                                            'recent',
                                            t?.tuition_jobs?.tab_recent,
                                            'Most recent',
                                        ],
                                        [
                                            'saved',
                                            t?.tuition_jobs?.tab_saved,
                                            'Saved jobs',
                                        ],
                                    ] as const
                                ).map(([key, label, fallback]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => selectTab(key)}
                                        className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                                            tab === key
                                                ? 'border-blue-600 text-blue-700'
                                                : 'border-transparent text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {str(label, fallback)}
                                    </button>
                                ))}
                            </div>
                        )}

                        {hasActiveFilters && (
                            <div className="mb-5 flex flex-wrap items-center gap-2">
                                <span className="text-sm text-slate-500">
                                    {str(
                                        t?.tuition_jobs?.showing_results_for,
                                        'Showing results for:',
                                    )}
                                </span>
                                {filters.location && (
                                    <FilterChip
                                        label={filters.location}
                                        onRemove={() =>
                                            removeFilter('location')
                                        }
                                    />
                                )}
                                {filters.class_level && (
                                    <FilterChip
                                        label={classLabel(
                                            filters.class_level,
                                            t,
                                        )}
                                        onRemove={() =>
                                            removeFilter('class_level')
                                        }
                                    />
                                )}
                                {filters.academic_group && (
                                    <FilterChip
                                        label={cap(filters.academic_group)}
                                        onRemove={() =>
                                            removeFilter('academic_group')
                                        }
                                    />
                                )}
                                {filters.gender && filters.gender !== 'any' && (
                                    <FilterChip
                                        label={cap(filters.gender)}
                                        onRemove={() => removeFilter('gender')}
                                    />
                                )}
                                {filters.level && (
                                    <FilterChip
                                        label={levelLabel(filters.level, t)}
                                        onRemove={() => removeFilter('level')}
                                    />
                                )}
                                {filters.min_salary && (
                                    <FilterChip
                                        label={`≥ ৳${Number(filters.min_salary).toLocaleString()}`}
                                        onRemove={() =>
                                            removeFilter('min_salary')
                                        }
                                    />
                                )}
                                {filters.max_days && (
                                    <FilterChip
                                        label={replaceVars(
                                            str(
                                                t?.tuition_jobs?.days_week,
                                                ':count d/wk',
                                            ),
                                            { count: filters.max_days },
                                        )}
                                        onRemove={() =>
                                            removeFilter('max_days')
                                        }
                                    />
                                )}
                            </div>
                        )}

                        <div className="text-sm font-medium text-slate-600">
                            {replaceVars(
                                str(
                                    t?.tuition_jobs?.posts_found,
                                    ':count posts found',
                                ),
                                { count: posts.total },
                            )}
                        </div>

                        {posts.data.length === 0 ? (
                            <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
                                <div className="mb-5 rounded-full border border-slate-100 bg-slate-50 p-5 shadow-sm">
                                    {tab === 'saved' ? (
                                        <Heart className="h-8 w-8 text-slate-400" />
                                    ) : (
                                        <Search className="h-8 w-8 text-slate-400" />
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {tab === 'saved'
                                        ? str(
                                              t?.tuition_jobs?.saved_empty,
                                              "You haven't saved any jobs yet.",
                                          )
                                        : str(
                                              t?.tuition_jobs?.no_posts_title,
                                              'No tuition posts found',
                                          )}
                                </h3>
                                <p className="mt-2 max-w-sm text-slate-600">
                                    {tab === 'saved'
                                        ? str(
                                              t?.tuition_jobs?.saved_empty_hint,
                                              'Tap the heart on any tuition post to save it for later.',
                                          )
                                        : str(
                                              t?.tuition_jobs?.no_posts,
                                              'No tuition posts found for your search.',
                                          )}
                                </p>
                                {hasActiveFilters && tab !== 'saved' && (
                                    <Link
                                        href="/tuition-jobs"
                                        className="mt-6 font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        {str(
                                            t?.tuition_jobs?.empty_clear,
                                            'Clear all filters',
                                        )}
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {posts.data.map((post) => (
                                    <TuitionCard
                                        key={post.id}
                                        post={post}
                                        t={t}
                                        showReasons={tab === 'best'}
                                        saveable={tabsAvailable}
                                        saved={savedSet.has(post.id)}
                                        onToggleSave={toggleSave}
                                    />
                                ))}
                            </div>
                        )}

                        {posts.last_page > 1 && (
                            <div className="mt-10 flex justify-center">
                                <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    {posts.links.map((link, i) =>
                                        link.url ? (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setIsFiltering(true);
                                                    router.visit(link.url!, {
                                                        preserveState: true,
                                                        onFinish: () =>
                                                            setIsFiltering(
                                                                false,
                                                            ),
                                                    });
                                                }}
                                                className={`cursor-pointer px-4 py-2 text-sm ${link.active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ) : (
                                            <span
                                                key={i}
                                                className="px-4 py-2 text-sm text-slate-400"
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <PublicFooter
                labels={{
                    name: str(t?.brand?.name),
                    tuition: str(t?.brand?.tuition),
                    media: str(t?.brand?.media),
                    copyright: str(t?.footer?.copyright),
                    terms: str(t?.footer?.terms),
                    privacy: str(t?.footer?.privacy),
                    contact: str(t?.footer?.contact),
                }}
            />
        </div>
    );
}
