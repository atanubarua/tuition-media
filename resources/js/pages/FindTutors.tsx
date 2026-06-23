import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CheckCircle2,
    BookMarked,
    CalendarDays,
    Building2,
    Filter,
    GraduationCap,
    Loader2,
    MapPin,
    Plus,
    Search,
    Trash2,
    User,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import ReactSelect from 'react-select';
import AutocompleteInput from '@/components/autocomplete-input';
import PublicNavbar from '@/components/public-navbar';
import PublicFooter from '@/components/public-footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
type LocationOption = { id: number; name: string; type?: string; division_id?: number; district_id?: number };

const CLASS_OPTIONS = [
    { value: 'nursery', label: 'Nursery' },
    { value: 'kg', label: 'KG' },
    { value: '1', label: 'Class 1' },
    { value: '2', label: 'Class 2' },
    { value: '3', label: 'Class 3' },
    { value: '4', label: 'Class 4' },
    { value: '5', label: 'Class 5' },
    { value: '6', label: 'Class 6' },
    { value: '7', label: 'Class 7' },
    { value: '8', label: 'Class 8' },
    { value: '9', label: 'Class 9' },
    { value: '10', label: 'Class 10' },
    { value: '11', label: 'Class 11' },
    { value: '12', label: 'Class 12' },
];

const NEEDS_GROUP = ['9', '10', '11', '12'];

type StudentEntry = {
    class_level: string;
    academic_group: string;
    message: string;
};

function emptyStudent(): StudentEntry {
    return { class_level: '', academic_group: '', message: '' };
}

type TutorProfile = {
    id: number;
    teachable_levels: string[] | null;
    teachable_classes: string[] | null;
    teachable_groups: string[] | null;
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
    preferred_locations: Subdistrict[];
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

function classLabel(level: string) {
    if (level === 'nursery') return 'Nursery';
    if (level === 'kg') return 'KG';
    return `Class ${level}`;
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
    class_level: string;
    academic_group: string;
    subject: string;
    gender: string;
    university: string;
};

const SELECT_STYLES = {
    control: (base: object) => ({ ...base, borderRadius: '0.5rem', borderColor: '#cbd5e1', minHeight: '38px', fontSize: '14px' }),
    menu: (base: object) => ({ ...base, zIndex: 60, fontSize: '14px' }),
    option: (base: object, state: { isFocused: boolean }) => ({
        ...base,
        backgroundColor: state.isFocused ? '#eff6ff' : 'white',
        color: '#1e293b',
    }),
    singleValue: (base: object) => ({ ...base, color: '#1e293b' }),
    input: (base: object) => ({ ...base, color: '#1e293b' }),
};

function TutorCard({ tutor, onViewProfile, t }: { tutor: Tutor; onViewProfile: (tutor: Tutor) => void; t: T }) {
    const profile = tutor.tutor_profile;
    const subjects = profile.subjects.map(s => s.name);
    const locations = profile.preferred_locations.map(l => l.name);
    const initials = tutor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div
            className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            onClick={() => onViewProfile(tutor)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewProfile(tutor); } }}
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
                        <h3 className="font-bold text-slate-900 truncate text-base group-hover:text-blue-700 transition-colors">{tutor.name}</h3>
                        {profile.is_verified && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-label="Verified Identity" />}
                    </div>
                    {profile.university ? (
                        <p className="mt-0.5 text-sm font-medium text-slate-600">{profile.university.name}</p>
                    ) : (
                        <p className="mt-0.5 text-sm text-slate-500 capitalize">
                            {replaceVars(str(t?.find_tutors?.gender_tutor, ':gender Tutor'), { gender: tutor.gender })}
                        </p>
                    )}
                    {profile.department && <p className="mt-0.5 truncate text-xs text-slate-500">{profile.department}</p>}
                </div>
            </div>

            <div className="mt-1 flex flex-wrap gap-1.5">
                {subjects.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">{s}</span>
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
    divisions,
    districts,
    subdistricts,
    canRegister = true,
}: {
    tutors: PaginatedTutors;
    filters: Filters;
    universities: University[];
    divisions: LocationOption[];
    districts: LocationOption[];
    subdistricts: LocationOption[];
    canRegister?: boolean;
}) {
    const { auth, translations: t } = usePage().props as any;

    const [location, setLocation] = useState(filters.location || '');
    const [classLevel, setClassLevel] = useState(filters.class_level || '');
    const [academicGroup, setAcademicGroup] = useState(filters.academic_group || '');
    const [gender, setGender] = useState(filters.gender || 'any');
    const [university, setUniversity] = useState(filters.university || '');
    const [isFiltering, setIsFiltering] = useState(false);

    const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Location for request
    const [divisionId, setDivisionId] = useState(0);
    const [districtId, setDistrictId] = useState(0);
    const [subdistrictId, setSubdistrictId] = useState(0);

    // Students list
    const [students, setStudents] = useState<StudentEntry[]>([emptyStudent()]);

    const filteredDistricts = districts.filter(d => d.division_id === divisionId);
    const filteredSubdistricts = subdistricts.filter(s => s.district_id === districtId);

    const subdistrictOptions = filteredSubdistricts.map(s => ({ value: s.id, label: s.name }));

    const updateStudent = (index: number, patch: Partial<StudentEntry>) => {
        setStudents(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
    };

    const addStudent = () => setStudents(prev => [...prev, emptyStudent()]);

    const removeStudent = (index: number) => setStudents(prev => prev.filter((_, i) => i !== index));

    const openProfileModal = (tutor: Tutor) => setSelectedTutor(tutor);

    const openRequestModal = () => {
        setDivisionId(0);
        setDistrictId(0);
        setSubdistrictId(0);
        setStudents([emptyStudent()]);
        setFormErrors({});
        setRequestModalOpen(true);
    };

    const closeRequestModal = () => {
        setRequestModalOpen(false);
        setFormErrors({});
    };

    const clearError = (key: string) => setFormErrors(prev => { const n = { ...prev }; delete n[key]; return n; });

    const validateForm = (): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (districtId && !divisionId) errors.division_id = 'Please select a division first.';
        if (subdistrictId && !districtId) errors.district_id = 'Please select a district first.';
        if (!divisionId) errors.division_id = 'Division is required.';
        if (!districtId) errors.district_id = 'District is required.';
        if (!subdistrictId) errors.subdistrict_id = 'Area is required.';

        students.forEach((s, i) => {
            if (!s.class_level) errors[`students.${i}.class_level`] = 'Class level is required.';
            if (NEEDS_GROUP.includes(s.class_level) && !s.academic_group) {
                errors[`students.${i}.academic_group`] = 'Academic group is required for this class.';
            }
            if (s.message.length > 2000) errors[`students.${i}.message`] = 'Message must not exceed 2000 characters.';
        });

        return errors;
    };

    const submitTutorRequest = () => {
        if (!selectedTutor || isSubmittingRequest) return;

        const errors = validateForm();
        if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

        setIsSubmittingRequest(true);
        router.post('/guardian/tutor-requests', {
            tutor_id: selectedTutor.id,
            division_id: divisionId || undefined,
            district_id: districtId || undefined,
            subdistrict_id: subdistrictId || undefined,
            students: students.map(s => ({
                class_level: s.class_level || undefined,
                academic_group: s.academic_group || undefined,
                message: s.message || undefined,
            })),
        }, {
            preserveScroll: true,
            onSuccess: () => { setIsSubmittingRequest(false); closeRequestModal(); },
            onError: (errs) => { setFormErrors(errs); setIsSubmittingRequest(false); },
            onFinish: () => setIsSubmittingRequest(false),
        });
    };

    const handleFilterSubmit = (e: FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (location.trim()) params.location = location.trim();
        if (classLevel) params.class_level = classLevel;
        if (classLevel && NEEDS_GROUP.includes(classLevel) && academicGroup) params.academic_group = academicGroup;
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
        setClassLevel('');
        setAcademicGroup('');
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

            <div className="bg-white border-b border-slate-200 pt-12 pb-12">
                <div className="mx-auto max-w-7xl px-4 lg:px-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">{str(t?.find_tutors?.heading, 'Find the Perfect Tutor')}</h1>
                    <p className="mt-3 text-lg text-slate-600">
                        {replaceVars(str(t?.find_tutors?.subheading, 'Browse through our directory of :count qualified and verified educators across Bangladesh.'), { count: tutors.total })}
                    </p>
                </div>
            </div>

            <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 flex flex-col lg:flex-row gap-8">
                <aside className="w-full lg:w-72 shrink-0">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                            <Filter className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-slate-900">{str(t?.find_tutors?.filters_heading, 'Filters')}</h2>
                        </div>
                        <form onSubmit={handleFilterSubmit} className="space-y-6">
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
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{str(t?.find_tutors?.label_university, 'University / Institution')}</label>
                                <ReactSelect
                                    isClearable
                                    isSearchable
                                    placeholder={str(t?.find_tutors?.any_university, 'Any University')}
                                    value={university ? { value: university, label: university } : null}
                                    onChange={(opt) => setUniversity(opt ? opt.value : '')}
                                    options={universities.map(u => ({ value: u.name, label: u.name }))}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            borderRadius: '0.75rem',
                                            borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
                                            boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                                            minHeight: '42px',
                                            fontSize: '14px',
                                        }),
                                        menu: (base) => ({ ...base, zIndex: 60, fontSize: '14px', borderRadius: '0.75rem' }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
                                            color: state.isSelected ? 'white' : '#1e293b',
                                        }),
                                        singleValue: (base) => ({ ...base, color: '#1e293b' }),
                                        placeholder: (base) => ({ ...base, color: '#94a3b8' }),
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        value={classLevel}
                                        onChange={(e) => { setClassLevel(e.target.value); setAcademicGroup(''); }}
                                        className="w-full rounded-xl border border-slate-300 pl-10 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 appearance-none bg-white"
                                    >
                                        <option value="">Any Class</option>
                                        {CLASS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            {NEEDS_GROUP.includes(classLevel) && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Academic Group</label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <select
                                            value={academicGroup}
                                            onChange={(e) => setAcademicGroup(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 pl-10 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 appearance-none bg-white"
                                        >
                                            <option value="">Any Group</option>
                                            <option value="science">Science</option>
                                            <option value="commerce">Commerce</option>
                                            <option value="arts">Arts</option>
                                        </select>
                                    </div>
                                </div>
                            )}
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
                            <div className="pt-2 flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isFiltering}
                                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isFiltering ? str(t?.find_tutors?.applying_filters, 'Applying Filters...') : str(t?.find_tutors?.apply_filters, 'Apply Filters')}
                                </button>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    disabled={!filters.location && !filters.class_level && !filters.university && filters.gender === 'any'}
                                    className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {str(t?.find_tutors?.clear_all, 'Reset')}
                                </button>
                            </div>
                        </form>
                    </div>
                </aside>

                <main className="flex-1">
                    {(filters.location || filters.class_level || filters.university || filters.gender !== 'any') && (
                        <div className="mb-6 flex flex-wrap gap-2 items-center text-sm">
                            <span className="text-slate-500">{str(t?.find_tutors?.showing_results_for, 'Showing results for:')}</span>
                            {filters.location && <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">{filters.location}</span>}
                            {filters.class_level && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
                                    {CLASS_OPTIONS.find(o => o.value === filters.class_level)?.label ?? filters.class_level}
                                    {filters.academic_group && ` · ${filters.academic_group.charAt(0).toUpperCase() + filters.academic_group.slice(1)}`}
                                </span>
                            )}
                            {filters.university && <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-800">{filters.university}</span>}
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
                            <p className="mt-2 text-slate-600 max-w-sm">{str(t?.find_tutors?.no_tutors_body, "We couldn't find any tutors matching your exact criteria. Try broadening your search filters.")}</p>
                            <button onClick={clearFilters} className="mt-6 font-semibold text-blue-600 hover:text-blue-700">
                                {str(t?.find_tutors?.clear_search, 'Clear search filters')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {tutors.data.map((tutor) => (
                                <TutorCard key={tutor.id} tutor={tutor} onViewProfile={openProfileModal} t={t} />
                            ))}
                        </div>
                    )}

                    {tutors.last_page > 1 && (
                        <div className="mt-12 flex justify-center">
                            <div className="inline-flex rounded-xl shadow-sm border border-slate-200 overflow-hidden bg-white">
                                {tutors.links.map((link, i) => {
                                    const isLast = i === tutors.links.length - 1;
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={i}
                                                className={`px-4 py-2 text-sm text-slate-400 font-medium border-slate-200 bg-slate-50 ${!isLast ? 'border-r' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => { setIsFiltering(true); router.visit(link.url!, { preserveState: true, onFinish: () => setIsFiltering(false) }); }}
                                            className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors ${link.active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'} ${!isLast ? 'border-r border-slate-200' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Tutor Profile Modal */}
            <Dialog open={!!selectedTutor} onOpenChange={(open) => !open && setSelectedTutor(null)}>
                {selectedTutor && (
                    <DialogContent className="flex max-h-[88vh] w-[94vw] max-w-3xl flex-col overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:rounded-[1.25rem]">
                        <DialogHeader className="sr-only">
                            <DialogTitle>{selectedTutor.name}</DialogTitle>
                            <DialogDescription>Tutor profile details</DialogDescription>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                            <header className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white sm:p-8">
                                <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                                <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                                <div className="relative">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white ring-4 ring-white/30 shadow-lg">
                                            {selectedTutor.tutor_profile.profile_photo ? (
                                                <img src={`/storage/${selectedTutor.tutor_profile.profile_photo}`} alt={selectedTutor.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold tracking-wide text-blue-700">
                                                    {selectedTutor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl" title={selectedTutor.name}>
                                                {selectedTutor.name}
                                            </h2>
                                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                                {selectedTutor.tutor_profile.is_verified && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        {str(t?.find_tutors?.modal_verified, 'Verified')}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold capitalize text-white ring-1 ring-white/25">
                                                    <User className="h-3.5 w-3.5" />
                                                    {selectedTutor.gender}
                                                </span>
                                                {isGraduated(selectedTutor.tutor_profile.academic_year) && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
                                                        <GraduationCap className="h-3.5 w-3.5" />
                                                        {selectedTutor.tutor_profile.experience_months
                                                            ? replaceVars(str(t?.find_tutors?.modal_experience_value, ':years years :months months'), { years: Math.floor(selectedTutor.tutor_profile.experience_months / 12), months: selectedTutor.tutor_profile.experience_months % 12 })
                                                            : str(t?.find_tutors?.new_tutor, 'New Tutor')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </header>

                            <div className="min-w-0 space-y-6 p-6 sm:p-8">
                                {selectedTutor.tutor_profile.bio && (
                                    <section>
                                        <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{str(t?.find_tutors?.modal_about, 'About')}</h3>
                                        <p className="mt-2 text-sm leading-7 text-slate-700">{selectedTutor.tutor_profile.bio}</p>
                                    </section>
                                )}

                                <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                                    <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{str(t?.find_tutors?.modal_education, 'Education')}</h3>
                                    <p className="mt-2 text-lg font-bold leading-7 text-slate-900" title={selectedTutor.tutor_profile.university?.name || str(t?.find_tutors?.modal_not_specified, 'Not specified')}>
                                        {selectedTutor.tutor_profile.university?.name || str(t?.find_tutors?.modal_not_specified, 'Not specified')}
                                    </p>
                                    {selectedTutor.tutor_profile.department && (
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-slate-600">
                                            <span className="inline-flex items-center gap-1.5" title={selectedTutor.tutor_profile.department}>
                                                <BookMarked className="h-3.5 w-3.5 text-slate-500" />{selectedTutor.tutor_profile.department}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5">
                                                <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                                                {isGraduated(selectedTutor.tutor_profile.academic_year)
                                                    ? graduatedYearLabel(selectedTutor.tutor_profile.intake_year, t)
                                                    : currentYearLabel(selectedTutor.tutor_profile.academic_year, t)}
                                            </span>
                                        </div>
                                    )}
                                </section>

                                {selectedTutor.tutor_profile.occupation === 'employed' && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                                        <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{str(t?.find_tutors?.modal_employment, 'Employment')}</h3>
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
                                    </section>
                                )}

                                {selectedTutor.tutor_profile.preferred_locations.length > 0 && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                                        <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{str(t?.find_tutors?.modal_locations, 'Preferred Locations')}</h3>
                                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                                            {selectedTutor.tutor_profile.preferred_locations.map((loc) => (
                                                <span key={loc.id} className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                                                    <MapPin className="h-3 w-3" />{loc.name}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <div className="space-y-6">
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                                        <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{str(t?.find_tutors?.modal_subjects, 'Subjects')}</h3>
                                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                                            {selectedTutor.tutor_profile.subjects.map((s) => (
                                                <span key={s.id} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800">{s.name}</span>
                                            ))}
                                        </div>
                                    </section>
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                                        <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{str(t?.find_tutors?.modal_levels, 'Class Levels')}</h3>
                                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                                            {selectedTutor.tutor_profile.teachable_classes?.length ? (
                                                selectedTutor.tutor_profile.teachable_classes.map((level) => (
                                                    <Badge key={level} variant="secondary" className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50">
                                                        {classLabel(level)}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-slate-500">{str(t?.find_tutors?.modal_not_specified, 'Not specified')}</p>
                                            )}
                                        </div>
                                    </section>
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                                        <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{str(t?.find_tutors?.modal_groups, 'Groups')}</h3>
                                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                                            {selectedTutor.tutor_profile.teachable_groups?.length ? (
                                                selectedTutor.tutor_profile.teachable_groups.map((group) => (
                                                    <Badge key={group} variant="secondary" className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-50">
                                                        {group}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-slate-500">{str(t?.find_tutors?.modal_not_specified, 'Not specified')}</p>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            {auth?.user?.role === 'guardian' ? (
                                <span className="hidden sm:block" />
                            ) : (
                                <p className="text-sm text-slate-500">Log in as a guardian to request this tutor.</p>
                            )}
                            <div className="flex gap-3 sm:justify-end">
                                <Button type="button" variant="outline" onClick={() => setSelectedTutor(null)}>
                                    {str(t?.find_tutors?.modal_close, 'Close')}
                                </Button>
                                {auth?.user?.role === 'guardian' && (
                                    <Button type="button" onClick={openRequestModal} className="bg-blue-600 text-white hover:bg-blue-700">
                                        Request Tutor
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {/* Request Tutor Modal */}
            <Dialog open={requestModalOpen} onOpenChange={(open) => !open && closeRequestModal()}>
                {selectedTutor && (
                    <DialogContent className="w-[94vw] max-w-2xl sm:max-w-2xl rounded-2xl bg-white p-0 shadow-2xl sm:rounded-[1.25rem]">
                        <DialogHeader className="border-b border-slate-200 px-6 py-4">
                            <DialogTitle className="text-lg font-bold text-slate-900">Request Tutor</DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                Requesting <span className="font-semibold text-slate-700">{selectedTutor.name}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
                            {/* Location */}
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-3">Location</p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Division</label>
                                        <select
                                            value={divisionId}
                                            onChange={(e) => { setDivisionId(Number(e.target.value)); setDistrictId(0); setSubdistrictId(0); clearError('division_id'); clearError('district_id'); }}
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 ${formErrors.division_id ? 'border-red-400' : 'border-slate-300'}`}
                                        >
                                            <option value={0}>Any division</option>
                                            {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                        {formErrors.division_id && <p className="text-xs text-red-500">{formErrors.division_id}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">District</label>
                                        <select
                                            value={districtId}
                                            onChange={(e) => { setDistrictId(Number(e.target.value)); setSubdistrictId(0); clearError('district_id'); }}
                                            disabled={!divisionId}
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60 ${formErrors.district_id ? 'border-red-400' : 'border-slate-300'}`}
                                        >
                                            <option value={0}>{divisionId ? 'Any district' : 'Select division first'}</option>
                                            {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                        {formErrors.district_id && <p className="text-xs text-red-500">{formErrors.district_id}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Area</label>
                                        <ReactSelect
                                            instanceId="req-subdistrict"
                                            isSearchable
                                            styles={{
                                                ...SELECT_STYLES,
                                                control: (base) => ({ ...base, borderRadius: '0.5rem', borderColor: formErrors.subdistrict_id ? '#f87171' : '#cbd5e1', minHeight: '38px', fontSize: '14px' }),
                                            }}
                                            options={subdistrictOptions}
                                            value={subdistrictOptions.find(o => o.value === subdistrictId) ?? null}
                                            onChange={(opt) => { setSubdistrictId(opt?.value ?? 0); clearError('subdistrict_id'); }}
                                            placeholder={!districtId ? 'Select district first' : 'Search area...'}
                                            isDisabled={!districtId}
                                            isClearable
                                        />
                                        {formErrors.subdistrict_id && <p className="text-xs text-red-500">{formErrors.subdistrict_id}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Students */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                                        {students.length > 1 ? 'Students' : 'Student'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={addStudent}
                                        className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Student
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {students.map((student, index) => (
                                        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                            {students.length > 1 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-slate-500">Student {index + 1}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeStudent(index)}
                                                        className="text-slate-400 hover:text-red-500 transition"
                                                        aria-label="Remove student"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-slate-700">Class Level <span className="text-red-500">*</span></label>
                                                    <select
                                                        value={student.class_level}
                                                        onChange={(e) => { updateStudent(index, { class_level: e.target.value, academic_group: '' }); clearError(`students.${index}.class_level`); clearError(`students.${index}.academic_group`); }}
                                                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 ${formErrors[`students.${index}.class_level`] ? 'border-red-400' : 'border-slate-300'}`}
                                                    >
                                                        <option value="">Select class</option>
                                                        {CLASS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                    {formErrors[`students.${index}.class_level`] && (
                                                        <p className="text-xs text-red-500">{formErrors[`students.${index}.class_level`]}</p>
                                                    )}
                                                </div>
                                                {NEEDS_GROUP.includes(student.class_level) && (
                                                    <div className="space-y-1">
                                                        <label className="text-sm font-medium text-slate-700">Academic Group <span className="text-red-500">*</span></label>
                                                        <select
                                                            value={student.academic_group}
                                                            onChange={(e) => { updateStudent(index, { academic_group: e.target.value }); clearError(`students.${index}.academic_group`); }}
                                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 ${formErrors[`students.${index}.academic_group`] ? 'border-red-400' : 'border-slate-300'}`}
                                                        >
                                                            <option value="">Select group</option>
                                                            <option value="science">Science</option>
                                                            <option value="commerce">Commerce</option>
                                                            <option value="arts">Arts</option>
                                                        </select>
                                                        {formErrors[`students.${index}.academic_group`] && (
                                                            <p className="text-xs text-red-500">{formErrors[`students.${index}.academic_group`]}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-slate-700">Message</label>
                                                <textarea
                                                    value={student.message}
                                                    onChange={(e) => { updateStudent(index, { message: e.target.value }); clearError(`students.${index}.message`); }}
                                                    rows={3}
                                                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 ${formErrors[`students.${index}.message`] ? 'border-red-400' : 'border-slate-300'}`}
                                                    placeholder="Any specific requirements for this student..."
                                                />
                                                {formErrors[`students.${index}.message`] && (
                                                    <p className="text-xs text-red-500">{formErrors[`students.${index}.message`]}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                            <Button type="button" variant="outline" onClick={closeRequestModal}>Cancel</Button>
                            <Button
                                type="button"
                                onClick={submitTutorRequest}
                                disabled={isSubmittingRequest}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            <PublicFooter
                labels={{
                    name: str(t?.brand?.name),
                    tuition: str(t?.brand?.tuition),
                    media: str(t?.brand?.media),
                    copyright: str(t?.find_tutors?.footer_copyright),
                    terms: str(t?.find_tutors?.footer_terms),
                    privacy: str(t?.find_tutors?.footer_privacy),
                    contact: str(t?.find_tutors?.footer_contact),
                }}
            />
        </div>
    );
}
