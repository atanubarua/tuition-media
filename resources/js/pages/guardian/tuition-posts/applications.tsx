import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { dashboard } from '@/routes';

type TutorProfile = {
    university: string | null;
    department: string | null;
    experience_months: number;
    bio: string | null;
};

type Tutor = {
    id: number;
    name: string;
    email: string;
    phone: string;
    gender: string | null;
    profile: TutorProfile | null;
};

type Application = {
    id: number;
    status: 'pending' | 'shortlisted' | 'rejected' | 'hired';
    cover_note: string | null;
    expected_salary: number | null;
    created_at: string;
    tutor: Tutor;
};

type Post = { id: number; title: string | null };

type Tab = 'all' | 'shortlisted' | 'hired' | 'rejected';

const STATUS_STYLES: Record<Application['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
};

function experienceLabel(months: number): string {
    if (months === 0) return 'No experience';
    const y = Math.floor(months / 12);
    const m = months % 12;
    return [y > 0 && `${y}yr`, m > 0 && `${m}mo`].filter(Boolean).join(' ');
}

export default function GuardianApplicationsIndex({
    post,
    applications,
}: {
    post: Post;
    applications: Application[];
}) {
    const [activeTab, setActiveTab] = useState<Tab>('all');

    const counts = {
        all: applications.length,
        shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
        hired: applications.filter((a) => a.status === 'hired').length,
        rejected: applications.filter((a) => a.status === 'rejected').length,
    };

    const filtered = activeTab === 'all' ? applications : applications.filter((a) => a.status === activeTab);

    function updateStatus(appId: number, status: string) {
        router.patch(`/guardian/tuition-posts/${post.id}/applications/${appId}`, { status });
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'shortlisted', label: 'Shortlisted' },
        { key: 'hired', label: 'Hired' },
        { key: 'rejected', label: 'Rejected' },
    ];

    return (
        <>
            <Head title="Applications" />
            <div className="p-4 md:p-6 space-y-5 max-w-3xl">
                <div>
                    <h1 className="text-2xl font-semibold">Applications</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {post.title ?? `Tuition Post #${post.id}`}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                activeTab === tab.key
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                                activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
                            }`}>
                                {counts[tab.key]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* List */}
                {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No applications in this category.</p>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((app) => (
                            <div key={app.id} className="rounded-xl border bg-card p-5 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{app.tutor.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {app.tutor.phone} · {app.tutor.gender ?? '—'}
                                            {app.tutor.profile && (
                                                <> · {app.tutor.profile.university ?? '—'}, {app.tutor.profile.department ?? '—'}</>
                                            )}
                                            {app.tutor.profile && (
                                                <> · {experienceLabel(app.tutor.profile.experience_months)} exp</>
                                            )}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0 ${STATUS_STYLES[app.status]}`}>
                                        {app.status}
                                    </span>
                                </div>

                                {app.expected_salary && (
                                    <p className="text-sm">
                                        Expected salary: <span className="font-medium">৳{app.expected_salary.toLocaleString()}</span>
                                    </p>
                                )}

                                {app.cover_note && (
                                    <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 whitespace-pre-line">
                                        {app.cover_note}
                                    </p>
                                )}

                                {app.tutor.profile?.bio && (
                                    <p className="text-xs text-muted-foreground italic">{app.tutor.profile.bio}</p>
                                )}

                                {app.status !== 'hired' && app.status !== 'rejected' && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {app.status !== 'shortlisted' && (
                                            <button
                                                onClick={() => updateStatus(app.id, 'shortlisted')}
                                                className="rounded-lg border border-blue-500 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                                            >
                                                Shortlist
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (confirm(`Hire ${app.tutor.name}?`)) updateStatus(app.id, 'hired');
                                            }}
                                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                                        >
                                            Hire
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Reject this application?')) updateStatus(app.id, 'rejected');
                                            }}
                                            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

GuardianApplicationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'My Tuition Posts', href: '/guardian/tuition-posts' },
        { title: 'Applications', href: '#' },
    ],
};
