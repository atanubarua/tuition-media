import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, FormEvent } from 'react';
import PublicNavbar from '@/components/public-navbar';
import AutocompleteInput from '@/components/autocomplete-input';
import {
    BookOpen,
    MapPin,
    User,
    Search,
    GraduationCap,
    CheckCircle2,
    Filter,
    ChevronLeft,
    ChevronRight,
    Star,
    Building2,
    BookMarked,
    CalendarDays,
    Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type T = Record<string, any>;

function str(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function replaceVars(template: string, vars: Record<string, string | number>) {
    return Object.entries(vars).reduce((r, [k, v]) => r.replace(`:${k}`, String(v)), template);
}

type Subject = { id: number; name: string };
type Subdistrict = { id: number; name: string; type: string };
type University = { id: number; name: string };

type TutorProfile = {
    id: number;
    teachable_levels: string[] | null;
    teachable_mediums: string[] | null;
    experience_months: number | null;
    profile_photo: string | null;
    bio: string | null;
    is_verified: boolean;
    university: University | null;
    department: string | null;
    occupation: 'student' | 'employed' | 'other' | null;
    job_title: string | null;
    job_organization: string | null;
    academic_year: number | null;
    intake_year: number | null;
    subjects: Subject[];
    preferred_locations: Subdistrict[]; // Serialized as preferred_locations by Laravel
};

function isGraduated(academicYear: number | null) {
    return Number(academicYear) === 5;
}

function currentYearLabel(academicYear: number | null, t: T) {
    const year = Number(academicYear);
    if (!year || year < 1 || year > 4) return str(t?.find_tutors?.modal_not_specified, 'Not specified');
    return replaceVars(str(t?.find_tutors?.modal_year, 'Year :n'), { n: year });
}

function graduatedYearLabel(intakeYear: number | null, t: T) {
    if (!intakeYear) return str(t?.find_tutors?.modal_not_specified, 'Not specified');
    return replaceVars(str(t?.find_tutors?.modal_graduated, 'Graduated :year'), { year: intakeYear + 4 });
}

type Tutor = {
    id: number;
    name: string;
    gender: string;
    tutor_profile: TutorProfile;
};

type PaginatedTutors = {
    data: Tutor[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Filters = {
    location: string;
    subject: string;
    gender: string;
    university: string;
};

function TutorCard({ tutor, onViewProfile, t }: { tutor: Tutor; onViewProfile: (tutor: Tutor) => void; t: T }) {
    const profile = tutor.tutor_profile;
    const subjects = profile.subjects.map(s => s.name);
    const locations = profile.preferred_locations.map(l => l.name);
    
    // Fallback initials
    const initials = tutor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div
            className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            onClick={() => onViewProfile(tutor)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onViewProfile(tutor);
                }
            }}
            role="button"
            tabIndex={0}
        >
            <div className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm relative">
                    {profile.profile_photo ? (
                        <img src={`/storage/${profile.profile_photo}`} alt={tutor.name} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-lg font-bold text-slate-400">{initials}</span>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 truncate text-base group-hover:text-blue-700 transition-colors">
                            {tutor.name}
                        </h3>
                        {profile.is_verified && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-label="Verified Identity" />
                        )}
                    </div>
                    
                    {profile.university ? (
                        <p className="mt-0.5 text-sm font-medium text-slate-600">
                            {profile.university.name}
                        </p>
                    ) : (
                        <p className="mt-0.5 text-sm text-slate-500 capitalize">
                            {replaceVars(str(t?.find_tutors?.gender_tutor, ':gender Tutor'), { gender: tutor.gender })}
                        </p>
                    )}
                    
                    {profile.department && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">{profile.department}</p>
                    )}
                </div>
            </div>

            {/* Subjects Tags */}
            <div className="mt-1 flex flex-wrap gap-1.5">
                {subjects.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
                        {s}
                    </span>
                ))}
                {subjects.length > 3 && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                        {replaceVars(str(t?.find_tutors?.more_subjects, '+:count more'), { count: subjects.length - 3 })}
                    </span>
                )}
            </div>

            <div className="mt-auto flex flex-col gap-1.5 border-t border-slate-100 pt-3 text-sm text-slate-500">
                <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1 leading-tight">
                        {locations.length > 0 ? locations.join(', ') : str(t?.find_tutors?.any_location, 'Any location')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">
                        {profile.experience_months
                            ? replaceVars(str(t?.find_tutors?.experience, ':yrs yrs :mos mos exp.'), { yrs: Math.floor(profile.experience_months / 12), mos: profile.experience_months % 12 })
                            : str(t?.find_tutors?.new_tutor, 'New Tutor')}
                    </span>
                </div>
            </div>
            
            <button 
                onClick={() => onViewProfile(tutor)}
                className="mt-1.5 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition group-hover:border-blue-400 hover:border-blue-600 hover:text-blue-800"
            >
                {str(t?.find_tutors?.view_profile, 'View Profile')}
            </button>
        </div>
    );
}

export default function FindTutors({
    tutors,
    filters,
    universities,
    canRegister = true,
}: {
    tutors: PaginatedTutors;
    filters: Filters;
    universities: University[];
    canRegister?: boolean;
}) {
    const { translations: t } = usePage().props as any;
    // Local state for the filter form
    const [location, setLocation] = useState(filters.location || '');
    const [subject, setSubject] = useState(filters.subject || '');
    const [gender, setGender] = useState(filters.gender || 'any');
    const [university, setUniversity] = useState(filters.university || '');

    // Modal state
    const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
    const [isFiltering, setIsFiltering] = useState(false);

    const handleFilterSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        const params: Record<string, string> = {};
        if (location.trim()) params.location = location.trim();
        if (subject.trim()) params.subject = subject.trim();
        if (university.trim()) params.university = university.trim();
        if (gender !== 'any') params.gender = gender;

        router.get('/find-tutors', params, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsFiltering(true),
            onError: () => setIsFiltering(false),
            onFinish: () => setIsFiltering(false),
        });
    };

    const clearFilters = () => {
        setLocation('');
        setSubject('');
        setGender('any');
        setUniversity('');
        router.get('/find-tutors');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900 flex flex-col">
            <Head title={str(t?.find_tutors?.page_title, 'Find Tutors – Tuition Media')} />
            {isFiltering && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/75 backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <p className="text-sm font-semibold text-slate-700">{str(t?.find_tutors?.applying_filters, 'Applying filters...')}</p>
                    </div>
                </div>
            )}

            <PublicNavbar canRegister={canRegister} active="find-tutors" />

            {/* Page Header */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-12">
                <div className="mx-auto max-w-7xl px-4 lg:px-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">{str(t?.find_tutors?.heading, 'Find the Perfect Tutor')}</h1>
                    <p className="mt-3 text-lg text-slate-600">
                        {replaceVars(str(t?.find_tutors?.subheading, 'Browse through our directory of :count qualified and verified educators across Bangladesh.'), { count: tutors.total })}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 flex flex-col lg:flex-row gap-8">
                
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-72 shrink-0">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                            <Filter className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-slate-900">{str(t?.find_tutors?.filters_heading, 'Filters')}</h2>
                        </div>

                        <form onSubmit={handleFilterSubmit} className="space-y-6">
                            {/* Area */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{str(t?.find_tutors?.label_area, 'Area / Location')}</label>
                                <AutocompleteInput
                                    value={location}
                                    onChange={setLocation}
                                    fetchUrl={(q) => `/api/locations?q=${encodeURIComponent(q)}`}
                                    mapLabel={(s) => s.label}
                                    mapValue={(s) => s.name}
                                    placeholder={str(t?.find_tutors?.placeholder_area, 'e.g. Dhanmondi, Mirpur...')}
                                    icon={<MapPin className="h-4 w-4 text-slate-400" />}
                                    className="w-full rounded-xl border border-slate-300 pl-10 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900"
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{str(t?.find_tutors?.label_subject, 'Subject Expertise')}</label>
                                <AutocompleteInput
                                    value={subject}
                                    onChange={setSubject}
                                    fetchUrl={(q) => `/api/subjects?q=${encodeURIComponent(q)}`}
                                    mapLabel={(s) => s}
                                    mapValue={(s) => s}
                                    placeholder={str(t?.find_tutors?.placeholder_subject, 'e.g. Physics, English...')}
                                    icon={<BookOpen className="h-4 w-4 text-slate-400" />}
                                    className="w-full rounded-xl border border-slate-300 pl-10 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900"
                                />
                            </div>

                            {/* University */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{str(t?.find_tutors?.label_university, 'University / Institution')}</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        value={university}
                                        onChange={(e) => setUniversity(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 pl-10 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 appearance-none bg-white"
                                    >
                                        <option value="">{str(t?.find_tutors?.any_university, 'Any University')}</option>
                                        {universities.map(u => (
                                            <option key={u.id} value={u.name}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{str(t?.find_tutors?.label_gender, 'Tutor Gender Preference')}</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 pl-10 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 appearance-none bg-white"
                                    >
                                        <option value="any">{str(t?.find_tutors?.any_gender, 'Any Gender')}</option>
                                        <option value="male">{str(t?.find_tutors?.gender_male, 'Male')}</option>
                                        <option value="female">{str(t?.find_tutors?.gender_female, 'Female')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={isFiltering}
                                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isFiltering ? str(t?.find_tutors?.applying_filters, 'Applying Filters...') : str(t?.find_tutors?.apply_filters, 'Apply Filters')}
                                </button>
                                
                                {(filters.location || filters.subject || filters.university || filters.gender !== 'any') && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                                    >
                                        {str(t?.find_tutors?.clear_all, 'Clear All')}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </aside>

                {/* Tutor Grid */}
                <main className="flex-1">
                    {/* Active Filters Display */}
                    {(filters.location || filters.subject || filters.university || filters.gender !== 'any') && (
                        <div className="mb-6 flex flex-wrap gap-2 items-center text-sm">
                            <span className="text-slate-500">{str(t?.find_tutors?.showing_results_for, 'Showing results for:')}</span>
                            {filters.location && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
                                    {filters.location}
                                </span>
                            )}
                            {filters.subject && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
                                    {filters.subject}
                                </span>
                            )}
                            {filters.university && (
                                <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-800">
                                    {filters.university}
                                </span>
                            )}
                            {filters.gender !== 'any' && (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800 capitalize">
                                    {replaceVars(str(t?.find_tutors?.gender_only, ':gender Only'), { gender: filters.gender })}
                                </span>
                            )}
                        </div>
                    )}

                    {tutors.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-24 text-center">
                            <div className="rounded-full bg-slate-50 p-5 shadow-sm mb-5 border border-slate-100">
                                <Search className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{str(t?.find_tutors?.no_tutors_title, 'No tutors found')}</h3>
                            <p className="mt-2 text-slate-600 max-w-sm">
                                {str(t?.find_tutors?.no_tutors_body, "We couldn't find any tutors matching your exact criteria. Try broadening your search filters.")}
                            </p>
                            <button 
                                onClick={clearFilters}
                                className="mt-6 font-semibold text-blue-600 hover:text-blue-700"
                            >
                                {str(t?.find_tutors?.clear_search, 'Clear search filters')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {tutors.data.map((tutor) => (
                                <TutorCard key={tutor.id} tutor={tutor} onViewProfile={setSelectedTutor} t={t} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {tutors.last_page > 1 && (
                        <div className="mt-12 flex justify-center">
                            <div className="inline-flex rounded-xl shadow-sm border border-slate-200 overflow-hidden bg-white">
                                {tutors.links.map((link, i) => {
                                    const isFirst = i === 0;
                                    const isLast = i === tutors.links.length - 1;
                                    
                                    // Make links inactive if they are null
                                    if (!link.url) {
                                        return (
                                            <span 
                                                key={i} 
                                                className={`px-4 py-2 text-sm text-slate-400 font-medium ${isFirst ? 'border-r' : ''} ${!isFirst && !isLast ? 'border-r' : ''} border-slate-200 bg-slate-50`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => { setIsFiltering(true); router.visit(link.url!, { preserveState: true, onFinish: () => setIsFiltering(false) }); }}
                                            className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors ${
                                                link.active 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                            } ${!isLast ? 'border-r border-slate-200' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>            {/* Tutor Profile Modal */}
            <Dialog open={!!selectedTutor} onOpenChange={(open) => !open && setSelectedTutor(null)}>
                {selectedTutor && (
                    <DialogContent className="w-[94vw] max-w-3xl rounded-2xl bg-white p-0 shadow-2xl sm:rounded-[1.25rem]">
                        <DialogHeader className="sr-only">
                            <DialogTitle>{selectedTutor.name}</DialogTitle>
                            <DialogDescription>Tutor profile details</DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[88vh] overflow-y-auto overflow-x-hidden bg-slate-50">
                            <div className="grid gap-0">
                                <aside className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200 p-6 text-slate-900 sm:p-8">
                                    <div className="absolute -top-16 -right-10 h-36 w-36 rounded-full bg-slate-300/40 blur-2xl" />
                                    <div className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-slate-400/30 blur-2xl" />

                                    <div className="relative">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                                            <div className="h-24 w-24 overflow-hidden rounded-2xl border border-blue-200 bg-white ring-4 ring-blue-100 shrink-0">
                                                {selectedTutor.tutor_profile.profile_photo ? (
                                                    <img src={`/storage/${selectedTutor.tutor_profile.profile_photo}`} alt={selectedTutor.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold tracking-wide">
                                                        {selectedTutor.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            <h2
                                                className="text-3xl font-black leading-tight tracking-tight sm:text-[2rem] sm:leading-tight"
                                                title={selectedTutor.name}
                                            >
                                                {selectedTutor.name}
                                            </h2>
                                        </div>
                                        <div className={`mt-6 grid gap-3 ${isGraduated(selectedTutor.tutor_profile.academic_year) ? 'sm:grid-cols-2' : ''}`}>
                                            {isGraduated(selectedTutor.tutor_profile.academic_year) && (
                                                <div className="rounded-xl border border-slate-300 bg-white/90 p-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{str(t?.find_tutors?.modal_experience, 'Experience')}</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                                        {selectedTutor.tutor_profile.experience_months
                                                            ? replaceVars(str(t?.find_tutors?.modal_experience_value, ':years years :months months'), { years: Math.floor(selectedTutor.tutor_profile.experience_months / 12), months: selectedTutor.tutor_profile.experience_months % 12 })
                                                            : str(t?.find_tutors?.new_tutor, 'New Tutor')}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="rounded-xl border border-slate-300 bg-white/90 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{str(t?.find_tutors?.modal_gender, 'Gender')}</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5" />
                                                        {selectedTutor.gender}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        {selectedTutor.tutor_profile.occupation === 'employed' && (
                                            <div className="mt-3 rounded-xl border border-slate-300 bg-white/90 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{str(t?.find_tutors?.modal_employment, 'Employment')}</p>
                                                <div className="mt-2 space-y-1.5 text-sm font-semibold text-slate-800">
                                                    <p className="flex items-start gap-2 leading-snug">
                                                        <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                                                        <span>{selectedTutor.tutor_profile.job_title || 'Employee'}</span>
                                                    </p>
                                                    <p className="flex items-start gap-2 leading-snug">
                                                        <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                                                        <span>{selectedTutor.tutor_profile.job_organization || str(t?.find_tutors?.modal_not_specified, 'Not specified')}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </aside>

                                <div className="min-w-0 bg-white p-6 sm:p-8">
                                    <div className="space-y-6">
                                        {selectedTutor.tutor_profile.bio && (
                                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                                <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{str(t?.find_tutors?.modal_about, 'About')}</h3>
                                                <p className="mt-3 text-sm leading-7 text-slate-700">{selectedTutor.tutor_profile.bio}</p>
                                            </section>
                                        )}

                                        <section className="space-y-4">
                                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                                <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{str(t?.find_tutors?.modal_education, 'Education')}</h3>
                                                <p className="mt-3 text-lg font-bold leading-7 text-slate-900" title={selectedTutor.tutor_profile.university?.name || str(t?.find_tutors?.modal_not_specified, 'Not specified')}>
                                                    {selectedTutor.tutor_profile.university?.name || str(t?.find_tutors?.modal_not_specified, 'Not specified')}
                                                </p>
                                                {selectedTutor.tutor_profile.department && (
                                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-slate-600">
                                                        <span className="inline-flex items-center gap-1.5" title={selectedTutor.tutor_profile.department}>
                                                            <BookMarked className="h-3.5 w-3.5 text-slate-500" />
                                                            {selectedTutor.tutor_profile.department}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                                                            {isGraduated(selectedTutor.tutor_profile.academic_year)
                                                                ? graduatedYearLabel(selectedTutor.tutor_profile.intake_year, t)
                                                                : currentYearLabel(selectedTutor.tutor_profile.academic_year, t)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                                <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{str(t?.find_tutors?.modal_subjects, 'Subjects')}</h3>
                                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                    {selectedTutor.tutor_profile.subjects.map((s) => (
                                                        <span key={s.id} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                        </section>
                                    </div>

                                    <div className="mt-8 flex items-center justify-end border-t border-slate-200 pt-6">
                                        <button
                                            onClick={() => setSelectedTutor(null)}
                                            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                                        >
                                            {str(t?.find_tutors?.modal_close, 'Close')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {/* Footer */}
            <footer className="bg-slate-900 py-12 text-slate-400 mt-auto">
                <div className="mx-auto max-w-7xl px-4 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
                        <BookOpen className="h-6 w-6 text-blue-500" />
                        Tuition<span className="text-amber-500">Media</span>
                    </div>
                    <p className="text-sm">
                        {replaceVars(str(t?.find_tutors?.footer_copyright, '© :year TuitionMedia. All rights reserved.'), { year: new Date().getFullYear() })}
                    </p>
                    <div className="flex gap-6 text-sm font-medium">
                        <Link href="#" className="hover:text-white transition">{str(t?.find_tutors?.footer_terms, 'Terms')}</Link>
                        <Link href="#" className="hover:text-white transition">{str(t?.find_tutors?.footer_privacy, 'Privacy')}</Link>
                        <Link href="#" className="hover:text-white transition">{str(t?.find_tutors?.footer_contact, 'Contact')}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

