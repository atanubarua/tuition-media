import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

type TutorProfile = {
    university: string | null;
    department: string | null;
    academic_year: number | null;
    intake_year: number | null;
    occupation: string | null;
    job_title: string | null;
    job_organization: string | null;
    teachable_levels: string[];
    teachable_mediums: string[];
    experience_months: number;
    subjects: string[];
    bio: string | null;
};

type Tutor = {
    id: number;
    name: string;
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

type Tab = 'all' | 'shortlisted' | 'rejected';

const STATUS_STYLES: Record<Application['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
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

const YEAR_LABELS: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: 'Graduated' };

function experienceLabel(months: number): string {
    if (months === 0) {
return 'No experience';
}

    const y = Math.floor(months / 12);
    const m = months % 12;

    return [y > 0 && `${y}yr`, m > 0 && `${m}mo`].filter(Boolean).join(' ');
}

function TutorModal({ app, onClose }: { app: Application; onClose: () => void }) {
    const p = app.tutor.profile;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40" />
            <div
                className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card border shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">{app.tutor.name}</h2>
                        <p className="text-sm text-muted-foreground capitalize">{app.tutor.gender ?? '—'}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
                </div>

                <div className="p-5 space-y-5">
                    {/* University */}
                    {p && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">University</p>
                                <p className="font-medium">{p.university ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Department</p>
                                <p className="font-medium">{p.department ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Academic Year</p>
                                <p className="font-medium">{p.academic_year ? YEAR_LABELS[p.academic_year] : '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Intake Year</p>
                                <p className="font-medium">{p.intake_year ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Occupation</p>
                                <p className="font-medium capitalize">
                                    {p.occupation === 'employed' && p.job_title
                                        ? `${p.job_title}${p.job_organization ? ` at ${p.job_organization}` : ''}`
                                        : (p.occupation ?? '—')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Experience</p>
                                <p className="font-medium">{experienceLabel(p.experience_months)}</p>
                            </div>
                        </div>
                    )}

                    {/* Subjects */}
                    {p?.subjects && p.subjects.length > 0 && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Subjects</p>
                            <div className="flex flex-wrap gap-1.5">
                                {p.subjects.map((s) => (
                                    <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Levels & Mediums */}
                    {p && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5">Can Teach</p>
                                <div className="flex flex-wrap gap-1">
                                    {p.teachable_levels.map((l) => (
                                        <span key={l} className="rounded bg-muted px-2 py-0.5 text-xs">{LEVEL_LABELS[l] ?? l}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5">Mediums</p>
                                <div className="flex flex-wrap gap-1">
                                    {p.teachable_mediums.map((m) => (
                                        <span key={m} className="rounded bg-muted px-2 py-0.5 text-xs">{MEDIUM_LABELS[m] ?? m}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bio */}
                    {p?.bio && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Bio</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{p.bio}</p>
                        </div>
                    )}

                    {/* Cover note */}
                    {app.cover_note && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Cover Note</p>
                            <p className="text-sm bg-muted/40 rounded-lg px-3 py-2 whitespace-pre-line">{app.cover_note}</p>
                        </div>
                    )}

                    {/* Expected salary */}
                    {app.expected_salary && (
                        <p className="text-sm">Expected salary: <span className="font-medium">৳{app.expected_salary.toLocaleString()}</span></p>
                    )}

                    {!p && (
                        <p className="text-sm text-muted-foreground">This tutor hasn't completed their profile yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function GuardianApplicationsIndex({
    post,
    applications,
}: {
    post: Post;
    applications: Application[];
}) {
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [universityFilter, setUniversityFilter] = useState<string>('');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    const universities = [...new Set(
        applications.map((a) => a.tutor.profile?.university).filter(Boolean) as string[]
    )].sort();

    const tabFiltered = activeTab === 'all' ? applications : applications.filter((a) => a.status === activeTab);
    const filtered = universityFilter
        ? tabFiltered.filter((a) => a.tutor.profile?.university === universityFilter)
        : tabFiltered;

    const counts = {
        all: applications.length,
        shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
        rejected: applications.filter((a) => a.status === 'rejected').length,
    };

    function updateStatus(appId: number, status: string) {
        router.patch(`/guardian/tuition-posts/${post.id}/applications/${appId}`, { status });
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'shortlisted', label: 'Shortlisted' },
        { key: 'rejected', label: 'Rejected' },
    ];

    return (
        <>
            <Head title="Applications" />
            {selectedApp && <TutorModal app={selectedApp} onClose={() => setSelectedApp(null)} />}
            <div className="p-4 md:p-6 space-y-5 max-w-3xl">
                <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="icon" asChild>
                        <Link href="/guardian/tuition-posts" aria-label="Back to My Tuition Posts">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-semibold">Applications</h1>
                </div>
                <p className="text-sm text-muted-foreground -mt-3">
                    {post.title ?? `Tuition Post #${post.id}`}
                </p>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="rounded-md border bg-background px-3 py-1.5 text-sm"
                        value={universityFilter}
                        onChange={(e) => setUniversityFilter(e.target.value)}
                    >
                        <option value="">All Universities</option>
                        {universities.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                    {universityFilter && (
                        <button
                            onClick={() => setUniversityFilter('')}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            ✕ Clear
                        </button>
                    )}
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
                                        <button
                                            onClick={() => setSelectedApp(app)}
                                            className="font-semibold hover:text-blue-600 hover:underline text-left"
                                        >
                                            {app.tutor.name}
                                        </button>
                                        <p className="text-xs text-muted-foreground">
                                            {app.tutor.gender ?? '—'}
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

                                {app.status === 'shortlisted' && (
                                        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                                            Our team will contact this tutor to confirm availability. We'll get back to you soon.
                                        </p>
                                    )}

                                {app.status === 'pending' && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <button
                                            onClick={() => updateStatus(app.id, 'shortlisted')}
                                            className="rounded-lg border border-blue-500 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                                        >
                                            Shortlist
                                        </button>
                                        <button
                                            onClick={() => {
 if (confirm('Reject this application?')) {
updateStatus(app.id, 'rejected');
} 
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
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'My Tuition Posts', href: '/guardian/tuition-posts' },
        { title: 'Applications', href: '#' },
    ],
};
