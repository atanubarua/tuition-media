import { Head, Link } from '@inertiajs/react';

type Subject = {
    id: number;
    name: string;
};

type Student = {
    id: number;
    class_level: string | null;
    curriculum: string | null;
    subjects: Subject[];
};

type University = {
    id: number;
    name: string;
};

type Guardian = {
    id: number;
    name: string;
    email: string;
};

type Post = {
    id: number;
    tuition_code: string | null;
    title: string | null;
    status: string;
    salary_type: string;
    salary_min: number | null;
    salary_max: number | null;
    days_per_week: number | null;
    duration_months: number | null;
    preferred_time_slots: string[] | null;
    tutor_gender_preference: string | null;
    required_experience_months: number | null;
    special_requirements: string | null;
    address_line: string | null;
    published_at: string | null;
    created_at: string;
    guardian: Guardian | null;
    students: Student[];
    preferred_universities: University[];
    applications_count: number;
};

type Location = {
    subdistrict: string;
    district: string;
    division: string;
} | null;

type Props = {
    post: Post;
    location: Location;
};

const formatDate = (value: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '-');

const STATUS_BADGE_STYLES: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-emerald-100 text-emerald-700',
    shortlisted: 'bg-sky-100 text-sky-700',
    assigned: 'bg-amber-100 text-amber-700',
    completed: 'bg-indigo-100 text-indigo-700',
    closed: 'bg-zinc-200 text-zinc-700',
    cancelled: 'bg-rose-100 text-rose-700',
};

const badgeClass = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium';

const formatSalary = (post: Post) => {
    if (post.salary_type === 'fixed' && post.salary_min) {
        return `BDT ${post.salary_min}`;
    }

    if (post.salary_type === 'range' && post.salary_min && post.salary_max) {
        return `BDT ${post.salary_min} - ${post.salary_max}`;
    }

    if (post.salary_type === 'negotiable') {
        return 'Negotiable';
    }

    return '-';
};

export default function AdminTuitionPostShow({ post, location }: Props) {
    return (
        <>
            <Head title={`Tuition ${post.tuition_code ?? `#${post.id}`}`} />

            <div className="space-y-6 p-4">
                <div className="rounded-xl border bg-gradient-to-r from-slate-50 to-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Tuition details</p>
                            <h1 className="text-2xl font-semibold">{post.tuition_code ?? `Tuition #${post.id}`}</h1>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`${badgeClass} ${STATUS_BADGE_STYLES[post.status] ?? 'bg-gray-100 text-gray-700'} capitalize`}>
                                    {post.status}
                                </span>
                                <span className={`${badgeClass} bg-blue-100 text-blue-700`}>
                                    {post.applications_count} application{post.applications_count === 1 ? '' : 's'}
                                </span>
                                <span className={`${badgeClass} bg-violet-100 text-violet-700 capitalize`}>
                                    {post.salary_type}
                                </span>
                                {post.days_per_week ? (
                                    <span className={`${badgeClass} bg-teal-100 text-teal-700`}>
                                        {post.days_per_week} day{post.days_per_week === 1 ? '' : 's'}/week
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <Link href="/admin/tuition-posts" className="text-sm font-medium hover:underline">
                            Back to tuition posts
                        </Link>
                    </div>
                    <div className="mt-3">
                        <p className="text-sm text-muted-foreground">{post.title || 'Untitled tuition post'}</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <h2 className="mb-3 text-base font-semibold">Overview</h2>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Salary:</span> {formatSalary(post)}</p>
                            <p><span className="font-medium">Days per week:</span> {post.days_per_week ?? '-'}</p>
                            <p><span className="font-medium">Duration:</span> {post.duration_months ? `${post.duration_months} month(s)` : '-'}</p>
                            <p><span className="font-medium">Published:</span> {formatDate(post.published_at)}</p>
                            <p><span className="font-medium">Created:</span> {formatDate(post.created_at)}</p>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <h2 className="mb-3 text-base font-semibold">Guardian & Location</h2>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Guardian:</span> {post.guardian?.name ?? '-'}</p>
                            <p><span className="font-medium">Email:</span> {post.guardian?.email ?? '-'}</p>
                            <p><span className="font-medium">Address:</span> {post.address_line ?? '-'}</p>
                            <p><span className="font-medium">Area:</span> {location ? `${location.subdistrict}, ${location.district}, ${location.division}` : '-'}</p>
                            <p><span className="font-medium">Tutor gender preference:</span> {post.tutor_gender_preference ?? '-'}</p>
                            <p><span className="font-medium">Required experience:</span> {post.required_experience_months ? `${post.required_experience_months} month(s)` : '-'}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold">Time & Requirements</h2>
                    <div className="space-y-2 text-sm">
                        <p>
                            <span className="font-medium">Preferred time slots:</span>{' '}
                            {post.preferred_time_slots && post.preferred_time_slots.length > 0
                                ? post.preferred_time_slots.join(', ')
                                : '-'}
                        </p>
                        <p><span className="font-medium">Special requirements:</span> {post.special_requirements || '-'}</p>
                        <p>
                            <span className="font-medium">Preferred universities:</span>{' '}
                            {post.preferred_universities.length > 0
                                ? post.preferred_universities.map((u) => u.name).join(', ')
                                : '-'}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold">Students</h2>
                    {post.students.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No students listed.</p>
                    ) : (
                        <div className="space-y-3">
                            {post.students.map((student, index) => (
                                <div key={student.id} className="rounded-md border p-3 text-sm">
                                    <p className="font-medium">Student {index + 1}</p>
                                    <p>Class: {student.class_level ?? '-'}</p>
                                    <p>Curriculum: {student.curriculum ?? '-'}</p>
                                    <p>
                                        Subjects:{' '}
                                        {student.subjects.length > 0
                                            ? student.subjects.map((subject) => subject.name).join(', ')
                                            : '-'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

AdminTuitionPostShow.layout = {
    breadcrumbs: [
        {
            title: 'Tuition Posts',
            href: '/admin/tuition-posts',
        },
        {
            title: 'Details',
            href: '',
        },
    ],
};
