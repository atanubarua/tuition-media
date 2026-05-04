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
import { login, register } from '@/routes';

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

const LEVEL_LABELS: Record<string, string> = {
    primary: 'Primary',
    high_school: 'High School',
    college: 'College',
    honors: 'Honors',
};

const MEDIUM_LABELS: Record<string, string> = {
    bangla: 'Bangla Medium',
    english: 'English Medium',
    madrasha: 'Madrasha',
    other: 'Other',
};

function classLabel(student: Student): string {
    if (student.academic_level === 'honors') {
return student.honors_subject ?? 'Honors';
}

    if (student.class_level === 'nursery') {
return 'Nursery';
}

    if (student.class_level === 'kg') {
return 'KG';
}

    if (student.class_level) {
return `Class ${student.class_level}`;
}

    return LEVEL_LABELS[student.academic_level] ?? student.academic_level;
}

function salaryText(post: Post): string {
    if (post.salary_type === 'negotiable') {
return 'Negotiable';
}

    if (post.salary_type === 'range' && post.salary_min && post.salary_max) {
return `৳${post.salary_min.toLocaleString()} – ৳${post.salary_max.toLocaleString()} /month`;
}

    if (post.salary_min) {
return `৳${post.salary_min.toLocaleString()} /month`;
}

    return 'Negotiable';
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
}: {
    post: Post;
    location: Location;
    has_applied: boolean;
    applicant_count: string;
    profile_incomplete: boolean;
}) {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    useFlashToast();

    useEffect(() => {
        const html = document.documentElement;
        const hadDark = html.classList.contains('dark');
        html.classList.remove('dark');

        return () => {
 if (hadDark) {
html.classList.add('dark');
} 
};
    }, []);

    const { data, setData, post: submit, processing, errors, reset } = useForm({
        cover_note: '',
        expected_salary: '',
    });

    function handleApply() {
        submit(`/tuition-posts/${post.id}/apply`, {
            onSuccess: () => {
 setOpen(false); reset(); 
},
        });
    }

    const title = post.title || `Tuition in ${location.subdistrict}`;
    const fullLocation = [post.address_line, location.subdistrict, location.district, location.division]
        .filter(Boolean)
        .join(', ');

    const allSubjects = [...new Set(post.students.flatMap((s) => s.subjects.map((sub) => sub.name)))];
    const postedDate = new Date(post.published_at).toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <>
            <Head title={`${title} – TuitionMedia`} />

            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                    <Link href="/" className="text-xl font-bold text-blue-600">
                        Tuition<span className="text-gray-800">Media</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                ← Back to listings
                            </Link>
                        ) : (
                            <>
                                <a href={`${login.url()}?redirect=/tuition-posts/${post.id}`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                    Log in
                                </a>
                                <a href={`${register.url()}?redirect=/tuition-posts/${post.id}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                                    Register
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <div className="mx-auto max-w-5xl px-4 py-8">
                {/* Breadcrumb */}
                <nav className="mb-5 flex items-center gap-2 text-sm text-gray-400">
                    <Link href="/" className="hover:text-blue-600">Home</Link>
                    <span>/</span>
                    <span className="text-gray-600 truncate">{title}</span>
                </nav>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    {/* Main content */}
                    <div className="flex-1 space-y-6">
                        {/* Header card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                    <p className="mt-1 text-sm text-gray-500">📍 {fullLocation}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">{salaryText(post)}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Posted {postedDate}</p>
                                </div>
                            </div>

                            {/* Subject pills */}
                            <div className="flex flex-wrap gap-2">
                                {allSubjects.map((s) => (
                                    <span key={s} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 font-medium">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Job details */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-2 text-base font-semibold text-gray-900">Tuition Details</h2>
                            <div className="divide-y divide-gray-100">
                                <DetailRow label="Location" value={fullLocation} />
                                <DetailRow label="Salary" value={salaryText(post)} />
                                <DetailRow label="Days per week" value={`${post.days_per_week} day${post.days_per_week > 1 ? 's' : ''}`} />
                                {post.preferred_time_slots && post.preferred_time_slots.length > 0 && (
                                    <DetailRow
                                        label="Preferred time"
                                        value={
                                            <div className="flex flex-wrap gap-1.5">
                                                {post.preferred_time_slots.map((t) => (
                                                    <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t}</span>
                                                ))}
                                            </div>
                                        }
                                    />
                                )}
                                {post.duration_months && (
                                    <DetailRow label="Duration" value={`${post.duration_months} month${post.duration_months > 1 ? 's' : ''}`} />
                                )}
                                <DetailRow
                                    label="Tutor gender"
                                    value={
                                        post.tutor_gender_preference === 'any'
                                            ? 'Male or Female'
                                            : post.tutor_gender_preference === 'male'
                                            ? 'Male only'
                                            : 'Female only'
                                    }
                                />
                                {post.required_experience_months != null && post.required_experience_months > 0 && (
                                    <DetailRow
                                        label="Experience required"
                                        value={
                                            post.required_experience_months >= 12
                                                ? `${Math.floor(post.required_experience_months / 12)} year${Math.floor(post.required_experience_months / 12) > 1 ? 's' : ''}`
                                                : `${post.required_experience_months} month${post.required_experience_months > 1 ? 's' : ''}`
                                        }
                                    />
                                )}
                            </div>
                        </div>

                        {/* Students */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-base font-semibold text-gray-900">
                                Student{post.students.length > 1 ? 's' : ''} ({post.students.length})
                            </h2>
                            <div className="space-y-4">
                                {post.students.map((student) => (
                                    <div key={student.id} className="rounded-lg bg-gray-50 p-4">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <span className="font-medium text-gray-900">{student.student_name}</span>
                                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">
                                                {classLabel(student)}
                                            </span>
                                            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs text-purple-700">
                                                {MEDIUM_LABELS[student.medium] ?? student.medium}
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
                                <h2 className="mb-3 text-base font-semibold text-gray-900">Preferred Tutor Universities</h2>
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
                                <h2 className="mb-2 text-base font-semibold text-gray-900">Special Requirements</h2>
                                <p className="text-sm text-gray-700 whitespace-pre-line">{post.special_requirements}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-72 space-y-4 lg:sticky lg:top-20">
                        {/* Apply card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center">
                            <p className="mb-1 text-2xl font-bold text-green-600">{salaryText(post)}</p>
                            <p className="mb-1 text-sm text-gray-500">{post.days_per_week} days/week</p>
                            <p className="mb-4 text-xs text-gray-400">
                                {applicant_count === 'Be the first to apply'
                                    ? 'Be the first to apply'
                                    : `${applicant_count} tutors applied`}
                            </p>

                            {auth.user ? (
                                auth.user.role === 'tutor' ? (
                                    profile_incomplete ? (
                                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                                            <p className="font-medium mb-1">Profile incomplete</p>
                                            <p className="text-xs mb-2">You need to complete your tutor profile before applying.</p>
                                            <a href="/tutor/profile/edit" className="block w-full rounded-lg bg-amber-500 py-2 text-center text-sm font-semibold text-white hover:bg-amber-600">
                                                Complete Profile
                                            </a>
                                        </div>
                                    ) : has_applied ? (
                                        <button disabled className="w-full rounded-lg bg-green-100 py-3 font-semibold text-green-700 cursor-default">
                                            ✓ Application Sent
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setOpen(true)}
                                            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                                        >
                                            Apply for this Tuition
                                        </button>
                                    )
                                ) : (
                                    <p className="text-sm text-gray-500">Only tutors can apply for tuitions.</p>
                                )
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 mb-3">Login as a tutor to apply</p>
                                    <a
                                        href={`${login.url()}?redirect=/tuition-posts/${post.id}`}
                                        className="block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700"
                                    >
                                        Log in to Apply
                                    </a>
                                    <a
                                        href={`${register.url()}?redirect=/tuition-posts/${post.id}`}
                                        className="block w-full rounded-lg border border-blue-600 py-3 text-center font-semibold text-blue-600 hover:bg-blue-50"
                                    >
                                        Create Account
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Quick summary */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700">Quick Summary</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Students</span>
                                    <span className="font-medium text-gray-900">{post.students.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Subjects</span>
                                    <span className="font-medium text-gray-900">{allSubjects.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Days/week</span>
                                    <span className="font-medium text-gray-900">{post.days_per_week}</span>
                                </div>
                                {post.duration_months && (
                                    <div className="flex justify-between">
                                        <span>Duration</span>
                                        <span className="font-medium text-gray-900">{post.duration_months} mo.</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Tutor gender</span>
                                    <span className="font-medium text-gray-900 capitalize">
                                        {post.tutor_gender_preference === 'any' ? 'Any' : post.tutor_gender_preference}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Link href="/" className="block text-center text-sm text-blue-600 hover:underline">
                            ← View all tuition posts
                        </Link>
                    </div>
                </div>
            </div>

            <footer className="mt-12 border-t bg-gray-900 py-8 text-center text-sm text-gray-400">
                <p>© {new Date().getFullYear()} TuitionMedia. All rights reserved.</p>
            </footer>

            {/* Apply modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply for this Tuition</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Cover Note <span className="text-xs text-gray-400">(optional)</span></Label>
                            <textarea
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                                rows={4}
                                maxLength={1000}
                                placeholder="Why are you a good fit for this tuition?"
                                value={data.cover_note}
                                onChange={(e) => setData('cover_note', e.target.value)}
                            />
                            <InputError message={errors.cover_note} />
                        </div>

                        {(post.salary_type === 'range' || post.salary_type === 'negotiable') && (
                            <div>
                                <Label>
                                    Expected Salary
                                    {post.salary_type === 'range' && post.salary_min && post.salary_max && (
                                        <span className="ml-1 text-xs text-gray-400 font-normal">
                                            (Guardian's range: ৳{post.salary_min.toLocaleString()}–৳{post.salary_max.toLocaleString()})
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
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleApply} disabled={processing}>
                            {processing ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
