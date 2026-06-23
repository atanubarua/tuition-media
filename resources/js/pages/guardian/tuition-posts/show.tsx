import { Head, Link } from '@inertiajs/react';
import { Pencil, Trash2, Users } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

type Student = {
    id: number;
    student_name: string | null;
    academic_level: string;
    class_level: string | null;
    academic_group: string | null;
    honors_subject: string | null;
    medium: string;
    subjects: string[];
};

type Post = {
    id: number;
    tuition_code: string | null;
    title: string | null;
    status: string;
    location: string | null;
    address_line: string | null;
    salary_type: string;
    salary_min: number | null;
    salary_max: number | null;
    days_per_week: number;
    preferred_time_slots: string[];
    duration_months: number | null;
    tutor_gender_preference: string;
    required_experience_months: number | null;
    special_requirements: string | null;
    published_at: string | null;
    created_at: string;
    preferred_universities: string[];
    application_counts: Record<string, number>;
    students: Student[];
};

const STATUS_STYLES: Record<string, string> = {
    draft:       'bg-slate-100 text-slate-700 border-slate-200',
    published:   'bg-sky-100 text-sky-700 border-sky-200',
    shortlisted: 'bg-amber-100 text-amber-700 border-amber-200',
    assigned:    'bg-indigo-100 text-indigo-700 border-indigo-200',
    completed:   'bg-emerald-100 text-emerald-700 border-emerald-200',
    closed:      'bg-zinc-200 text-zinc-700 border-zinc-300',
    cancelled:   'bg-rose-100 text-rose-700 border-rose-200',
};

const APP_STATUS_STYLES: Record<string, string> = {
    pending:      'bg-yellow-100 text-yellow-700',
    shortlisted:  'bg-blue-100 text-blue-700',
    interested:   'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-slate-100 text-slate-600',
    rejected:     'bg-red-100 text-red-700',
    hired:        'bg-green-100 text-green-700',
};

function salaryLabel(post: Post): string {
    if (post.salary_type === 'negotiable') return 'Negotiable';
    if (post.salary_type === 'fixed' && post.salary_min) return `BDT ${post.salary_min.toLocaleString()}`;
    if (post.salary_type === 'range' && post.salary_min && post.salary_max)
        return `BDT ${post.salary_min.toLocaleString()} – ${post.salary_max.toLocaleString()}`;
    return '—';
}

function classLabel(student: Student): string {
    if (student.academic_level === 'honors') return `Honors – ${student.honors_subject ?? ''}`;
    const level = student.class_level ?? '';
    const prefix = isNaN(Number(level)) ? '' : 'Class ';
    const group = student.academic_group ? ` (${student.academic_group})` : '';
    return `${prefix}${level.charAt(0).toUpperCase() + level.slice(1)}${group}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex gap-2 py-2 text-sm border-b last:border-0">
            <span className="w-48 shrink-0 text-muted-foreground">{label}</span>
            <span className="font-medium">{value ?? '—'}</span>
        </div>
    );
}

export default function GuardianTuitionPostShow({ post }: { post: Post }) {
    const totalApplications = Object.values(post.application_counts).reduce((a, b) => a + b, 0);

    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this tuition post?')) return;
        router.delete(`/guardian/tuition-posts/${post.id}`, {
            onSuccess: () => router.visit('/guardian/tuition-posts'),
        });
    };

    return (
        <>
            <Head title={post.title ?? `Post #${post.id}`} />

            <div className="w-full space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold">
                                {post.title ?? `Tuition Post #${post.id}`}
                            </h1>
                            <Badge
                                variant="outline"
                                className={`capitalize ${STATUS_STYLES[post.status] ?? 'bg-gray-100 text-gray-700'}`}
                            >
                                {post.status}
                            </Badge>
                        </div>
                        {post.tuition_code && (
                            <p className="mt-1 font-mono text-xs text-muted-foreground">{post.tuition_code}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/guardian/tuition-posts/${post.id}/edit`}>
                                <Pencil className="mr-1.5 size-4" /> Edit
                            </Link>
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-1.5 size-4" /> Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left: post details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Details card */}
                        <div className="rounded-lg border p-5">
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Post Details</h2>
                            <DetailRow label="Location" value={[post.location, post.address_line].filter(Boolean).join(', ') || null} />
                            <DetailRow label="Salary" value={salaryLabel(post)} />
                            <DetailRow label="Days per week" value={`${post.days_per_week} day${post.days_per_week !== 1 ? 's' : ''}`} />
                            <DetailRow
                                label="Preferred time slots"
                                value={post.preferred_time_slots.length ? post.preferred_time_slots.join(', ') : null}
                            />
                            <DetailRow
                                label="Duration"
                                value={post.duration_months ? `${post.duration_months} month${post.duration_months !== 1 ? 's' : ''}` : null}
                            />
                            <DetailRow
                                label="Tutor gender"
                                value={post.tutor_gender_preference === 'any' ? 'Any' : post.tutor_gender_preference}
                            />
                            <DetailRow
                                label="Min. experience"
                                value={post.required_experience_months ? `${post.required_experience_months} months` : null}
                            />
                            <DetailRow
                                label="Preferred universities"
                                value={post.preferred_universities.length ? post.preferred_universities.join(', ') : null}
                            />
                            <DetailRow label="Posted on" value={post.created_at} />
                            <DetailRow label="Published on" value={post.published_at ?? null} />
                            {post.special_requirements && (
                                <div className="pt-2 text-sm">
                                    <p className="text-muted-foreground">Special requirements</p>
                                    <p className="mt-1 whitespace-pre-wrap font-medium">{post.special_requirements}</p>
                                </div>
                            )}
                        </div>

                        {/* Students card */}
                        <div className="rounded-lg border p-5">
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Students ({post.students.length})
                            </h2>
                            <div className="space-y-4">
                                {post.students.map((student, i) => (
                                    <div key={student.id} className="rounded-md border p-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="size-4 text-muted-foreground" />
                                            <span className="font-medium">
                                                {student.student_name || `Student ${i + 1}`}
                                            </span>
                                            <span className="text-xs text-muted-foreground">— {classLabel(student)}</span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                            <span className="capitalize">Medium: {student.medium}</span>
                                            {student.subjects.length > 0 && (
                                                <span>Subjects: {student.subjects.join(', ')}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: applications summary */}
                    <div className="space-y-6">
                        <div className="rounded-lg border p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Applications</h2>
                                {totalApplications > 0 && (
                                    <Link
                                        href={`/guardian/tuition-posts/${post.id}/applications`}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Manage →
                                    </Link>
                                )}
                            </div>

                            {totalApplications === 0 ? (
                                <p className="text-sm text-muted-foreground">No applications yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-2xl font-bold">{totalApplications}</p>
                                    <div className="space-y-1.5">
                                        {Object.entries(post.application_counts).map(([status, count]) => (
                                            <div key={status} className="flex items-center justify-between text-sm">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${APP_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {status.replace('_', ' ')}
                                                </span>
                                                <span className="font-medium">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

GuardianTuitionPostShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'My Tuition Posts', href: '/guardian/tuition-posts' },
        { title: 'View Post' },
    ],
};
