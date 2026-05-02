import { Head, Link } from '@inertiajs/react';
import { dashboard } from '@/routes';

type Application = {
    id: number;
    status: 'pending' | 'shortlisted' | 'rejected' | 'hired';
    expected_salary: number | null;
    created_at: string;
    post: { id: number; title: string | null };
};

const STATUS_STYLES: Record<Application['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
};

export default function TutorApplicationsIndex({ applications }: { applications: Application[] }) {
    return (
        <>
            <Head title="My Applications" />
            <div className="p-4 md:p-6 space-y-4 max-w-2xl">
                <h1 className="text-2xl font-semibold">My Applications</h1>

                {applications.length === 0 ? (
                    <p className="text-muted-foreground text-sm">You haven't applied for any tuitions yet.</p>
                ) : (
                    <div className="space-y-3">
                        {applications.map((app) => (
                            <div key={app.id} className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
                                <div>
                                    <Link
                                        href={`/tuition-posts/${app.post.id}`}
                                        className="font-medium text-sm hover:text-blue-600"
                                    >
                                        {app.post.title ?? `Tuition #${app.post.id}`}
                                    </Link>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Applied {new Date(app.created_at).toLocaleDateString('en-BD', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        {app.expected_salary ? ` · Expected ৳${app.expected_salary.toLocaleString()}` : ''}
                                    </p>
                                </div>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0 ${STATUS_STYLES[app.status]}`}>
                                    {app.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

TutorApplicationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'My Applications', href: '/tutor/applications' },
    ],
};
