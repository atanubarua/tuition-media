import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';
import PublicNavbar from '@/components/public-navbar';

type Subject = { id: number; name: string };

type Student = {
    id: number;
    student_name: string;
    academic_level: string;
    class_level: string | null;
    honors_subject: string | null;
    medium: string;
    subjects: Subject[];
};

type University = { id: number; name: string };

type Post = {
    id: number;
    title: string | null;
    address_line: string | null;
    salary_type: string;
    salary_min: number | null;
    salary_max: number | null;
    days_per_week: number;
    preferred_time_slots: string[] | null;
    duration_months: number | null;
    tutor_gender_preference: string;
    required_experience_months: number | null;
    special_requirements: string | null;
    published_at: string;
    students: Student[];
    preferred_universities: University[];
    guardian: { id: number; name: string };
};

type Location = {
    subdistrict: string;
    district: string;
    division: string;
};

type Translations = Record<string, any>;

function t(translations: Translations, key: string, vars: Record<string, string | number> = {}): string {
    const keys = `show.${key}`.split('.');
    let val: any = translations;
    for (const k of keys) {
        val = val?.[k];
    }
    if (typeof val !== 'string') return key;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`:${k}`, String(v)), val);
}

function classLabel(student: Student, tr: Translations): string {
    if (student.academic_level === 'honors') return student.honors_subject ?? t(tr, 'levels.honors');
    if (student.class_level === 'nursery') return t(tr, 'class_nursery');
    if (student.class_level === 'kg') return t(tr, 'class_kg');
    if (student.class_level) return t(tr, 'class_level', { level: student.class_level });
    return t(tr, `levels.${student.academic_level}`) || student.academic_level;
}

function salaryText(post: Post, tr: Translations, locale: string): string {
    if (post.salary_type === 'negotiable') return t(tr, 'salary_negotiable');
    const fmt = (n: number) => `৳${n.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}`;
    if (post.salary_type === 'range' && post.salary_min && post.salary_max) {
        return `${fmt(post.salary_min)} – ${fmt(post.salary_max)} ${t(tr, 'salary_month')}`;
    }
    if (post.salary_min) return `${fmt(post.salary_min)} ${t(tr, 'salary_month')}`;
    return t(tr, 'salary_negotiable');
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
            <span className="w-44 shrink-0 text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
    );
}

export default function TuitionPostShow({
    post,
    location,
    has_applied,
    applicant_count,
    profile_incomplete,
    locale = 'en',
    translations,
}: {
    post: Post;
    location: Location;
    has_applied: boolean;
    applicant_count: string;
    profile_incomplete: boolean;
    locale: string;
    translations: Translations;
}) {
    const { auth } = usePage().props as any;
    const [open, setOpen] = useState(false);
    useFlashToast();

    useEffect(() => {
        const html = document.documentElement;
        const hadDark = html.classList.contains('dark');
        html.classList.remove('dark');
        return () => { if (hadDark) html.classList.add('dark'); };
    }, []);

    const { data, setData, post: submit, processing, errors, reset } = useForm({
        cover_note: '',
        expected_salary: '',
    });

    function handleApply() {
        submit(`/tuition-posts/${post.id}/apply`, {
            onSuccess: () => { setOpen(false); reset(); },
        });
    }

    const tr = (key: string, vars: Record<string, string | number> = {}) => t(translations, key, vars);

    const title = post.title || tr('tuition_details');
    const fullLocation = [post.address_line, location.subdistrict, location.district, location.division]
        .filter(Boolean)
        .join(', ');

    const allSubjects = [...new Set(post.students.flatMap((s) => s.subjects.map((sub) => sub.name)))];
    const postedDate = new Date(post.published_at).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const daysLabel = post.days_per_week > 1
        ? tr('days_value_plural', { count: post.days_per_week })
        : tr('days_value', { count: post.days_per_week });

    const applicantLabel = applicant_count === 'Be the first to apply'
        ? tr('first_to_apply')
        : tr('applicants', { count: applicant_count });

    return (
        <>
            <Head title={`${title} – TuitionMedia`} />

            <PublicNavbar />

            <div className="mx-auto max-w-5xl px-4 py-8">
                <nav className="mb-5 flex items-center gap-2 text-sm text-gray-400">
                    <Link href="/" className="hover:text-blue-600">{tr('home')}</Link>
                    <span>/</span>
                    <span className="text-gray-600 truncate">{title}</span>
                </nav>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    <div className="flex-1 space-y-6">
                        {/* Header card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                    <p className="mt-1 text-sm text-gray-500">📍 {fullLocation}</p>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 sm:mt-0">{tr('posted', { date: postedDate })}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {allSubjects.map((s) => (
                                    <span key={s} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 font-medium">{s}</span>
                                ))}
                            </div>
                        </div>

                        {/* Job details */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-2 text-base font-semibold text-gray-900">{tr('tuition_details')}</h2>
                            <div className="divide-y divide-gray-100">
                                <DetailRow label={tr('location')} value={fullLocation} />
                                <DetailRow label={tr('salary')} value={salaryText(post, translations, locale)} />
                                <DetailRow label={tr('days_per_week')} value={daysLabel} />
                                {post.preferred_time_slots && post.preferred_time_slots.length > 0 && (
                                    <DetailRow
                                        label={tr('preferred_time')}
                                        value={
                                            <div className="flex flex-wrap gap-1.5">
                                                {post.preferred_time_slots.map((slot) => (
                                                    <span key={slot} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{slot}</span>
                                                ))}
                                            </div>
                                        }
                                    />
                                )}
                                {post.duration_months && (
                                    <DetailRow
                                        label={tr('duration')}
                                        value={post.duration_months > 1
                                            ? tr('duration_value_plural', { count: post.duration_months })
                                            : tr('duration_value', { count: post.duration_months })}
                                    />
                                )}
                                <DetailRow
                                    label={tr('tutor_gender')}
                                    value={
                                        post.tutor_gender_preference === 'any'
                                            ? tr('gender_any')
                                            : post.tutor_gender_preference === 'male'
                                            ? tr('gender_male')
                                            : tr('gender_female')
                                    }
                                />
                                {post.required_experience_months != null && post.required_experience_months > 0 && (
                                    <DetailRow
                                        label={tr('experience_required')}
                                        value={
                                            post.required_experience_months >= 12
                                                ? (() => {
                                                    const yrs = Math.floor(post.required_experience_months / 12);
                                                    return yrs > 1 ? tr('experience_years_plural', { count: yrs }) : tr('experience_years', { count: yrs });
                                                })()
                                                : post.required_experience_months > 1
                                                    ? tr('experience_months_plural', { count: post.required_experience_months })
                                                    : tr('experience_months', { count: post.required_experience_months })
                                        }
                                    />
                                )}
                            </div>
                        </div>

                        {/* Students */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-base font-semibold text-gray-900">
                                {post.students.length > 1
                                    ? tr('students_heading_plural', { count: post.students.length })
                                    : tr('students_heading', { count: post.students.length })}
                            </h2>
                            <div className="space-y-4">
                                {post.students.map((student) => (
                                    <div key={student.id} className="rounded-lg bg-gray-50 p-4">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <span className="font-medium text-gray-900">{student.student_name}</span>
                                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">
                                                {classLabel(student, translations)}
                                            </span>
                                            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs text-purple-700">
                                                {t(translations, `mediums.${student.medium}`) || student.medium}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {student.subjects.map((sub) => (
                                                <span key={sub.id} className="rounded bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                                                    {sub.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preferred universities */}
                        {post.preferred_universities.length > 0 && (
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">{tr('preferred_universities')}</h2>
                                <div className="flex flex-wrap gap-2">
                                    {post.preferred_universities.map((u) => (
                                        <span key={u.id} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                                            {u.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Special requirements */}
                        {post.special_requirements && (
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-2 text-base font-semibold text-gray-900">{tr('special_requirements')}</h2>
                                <p className="text-sm text-gray-700 whitespace-pre-line">{post.special_requirements}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-72 space-y-4 lg:sticky lg:top-20">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center">
                            <p className="mb-1 text-2xl font-bold text-green-600">{salaryText(post, translations, locale)}</p>
                            <p className="mb-1 text-sm text-gray-500">{tr('apply_days_week', { count: post.days_per_week })}</p>
                            <p className="mb-4 text-xs text-gray-400">{applicantLabel}</p>

                            {auth.user ? (
                                (auth.user as any).role === 'tutor' ? (
                                    profile_incomplete ? (
                                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                                            <p className="font-medium mb-1">{tr('profile_incomplete_title')}</p>
                                            <p className="text-xs mb-2">{tr('profile_incomplete_body')}</p>
                                            <a href="/tutor/profile/edit" target="_blank" rel="noopener noreferrer" className="block w-full rounded-lg bg-amber-500 py-2 text-center text-sm font-semibold text-white hover:bg-amber-600">
                                                {tr('complete_profile')}
                                            </a>
                                        </div>
                                    ) : has_applied ? (
                                        <button disabled className="w-full rounded-lg bg-green-100 py-3 font-semibold text-green-700 cursor-default">
                                            {tr('application_sent')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setOpen(true)}
                                            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                                        >
                                            {tr('apply_button')}
                                        </button>
                                    )
                                ) : (
                                    <p className="text-sm text-gray-500">{tr('tutors_only')}</p>
                                )
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 mb-3">{tr('login_prompt')}</p>
                                    <a
                                        href={`/login?redirect=/tuition-posts/${post.id}`}
                                        className="block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700"
                                    >
                                        {tr('log_in_to_apply')}
                                    </a>
                                    <a
                                        href={`/register?redirect=/tuition-posts/${post.id}`}
                                        className="block w-full rounded-lg border border-blue-600 py-3 text-center font-semibold text-blue-600 hover:bg-blue-50"
                                    >
                                        {tr('create_account')}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Quick summary */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700">{tr('quick_summary')}</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>{tr('summary_students')}</span>
                                    <span className="font-medium text-gray-900">{post.students.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{tr('summary_subjects')}</span>
                                    <span className="font-medium text-gray-900">{allSubjects.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{tr('summary_days')}</span>
                                    <span className="font-medium text-gray-900">{post.days_per_week}</span>
                                </div>
                                {post.duration_months && (
                                    <div className="flex justify-between">
                                        <span>{tr('summary_duration')}</span>
                                        <span className="font-medium text-gray-900">{tr('summary_duration_value', { count: post.duration_months })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>{tr('summary_tutor_gender')}</span>
                                    <span className="font-medium text-gray-900 capitalize">
                                        {post.tutor_gender_preference === 'any' ? tr('summary_gender_any') : post.tutor_gender_preference}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Link href="/" className="block text-center text-sm text-blue-600 hover:underline">
                            {tr('view_all_posts')}
                        </Link>
                    </div>
                </div>
            </div>

            <footer className="mt-12 border-t bg-gray-900 py-8 text-center text-sm text-gray-400">
                <p>© {new Date().getFullYear()} TuitionMedia. {locale === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}</p>
            </footer>

            {/* Apply modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{tr('modal_title')}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>{tr('cover_note_label')} <span className="text-xs text-gray-400">{tr('cover_note_optional')}</span></Label>
                            <textarea
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                                rows={4}
                                maxLength={1000}
                                placeholder={tr('cover_note_placeholder')}
                                value={data.cover_note}
                                onChange={(e) => setData('cover_note', e.target.value)}
                            />
                            <InputError message={errors.cover_note} />
                        </div>

                        {(post.salary_type === 'range' || post.salary_type === 'negotiable') && (
                            <div>
                                <Label>
                                    {tr('expected_salary_label')}
                                    {post.salary_type === 'range' && post.salary_min && post.salary_max && (
                                        <span className="ml-1 text-xs text-gray-400 font-normal">
                                            {tr('guardians_range', { min: post.salary_min.toLocaleString(), max: post.salary_max.toLocaleString() })}
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    type="number"
                                    min={0}
                                    className="mt-1"
                                    placeholder="e.g. 5000"
                                    value={data.expected_salary}
                                    onChange={(e) => setData('expected_salary', e.target.value)}
                                />
                                <InputError message={errors.expected_salary} />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>{tr('cancel')}</Button>
                        <Button onClick={handleApply} disabled={processing}>
                            {processing ? tr('submitting') : tr('submit_application')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
