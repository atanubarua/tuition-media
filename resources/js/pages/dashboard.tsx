import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

type GuardianDashboardData = {
    stats: {
        total_posts: number;
        published_posts: number;
        total_applications: number;
        pending_applications: number;
    };
    recent_posts: Array<{
        id: number;
        title: string | null;
        status: string;
        applications_count: number;
        created_at: string;
    }>;
    recent_applications: Array<{
        id: number;
        status: 'pending' | 'shortlisted' | 'interested' | 'not_interested' | 'rejected' | 'hired';
        created_at: string;
        post: { id: number | null; title: string | null };
        tutor: { id: number | null; name: string | null };
    }>;
};

type TutorDashboardData = {
    stats: {
        total_applications: number;
        pending_applications: number;
        shortlisted_applications: number;
        hired_applications: number;
    };
    recent_applications: Array<{
        id: number;
        status: 'pending' | 'shortlisted' | 'interested' | 'not_interested' | 'rejected' | 'hired';
        expected_salary: number | null;
        created_at: string;
        post: { id: number | null; title: string | null; status: string | null };
    }>;
};

type AdminDashboardData = {
    stats: {
        guardians: number;
        tutors: number;
        tuitionPosts: number;
        applications: number;
        publishedPosts: number;
        assignedPosts: number;
        pendingApplications: number;
        shortlistedApplications: number;
        hiredApplications: number;
        contactInterested: number;
        tutorRequestsPending: number;
        commissionUnpaid: number;
        commissionPartial: number;
        commissionDueAmount: number;
    };
    recent_posts: Array<{
        id: number;
        tuition_code: string | null;
        title: string | null;
        status: string;
        applications_count: number;
        created_at: string;
        guardian: { id: number; name: string } | null;
    }>;
    recent_applications: Array<{
        id: number;
        status: 'pending' | 'shortlisted' | 'interested' | 'not_interested' | 'rejected' | 'hired';
        commission_payment_status: 'unpaid' | 'partial' | 'paid' | null;
        created_at: string;
        post: { id: number; tuition_code: string | null; title: string | null } | null;
        tutor: { id: number; name: string } | null;
    }>;
    recent_tutor_requests: Array<{
        id: number;
        status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'archived';
        subject: string | null;
        location: string | null;
        created_at: string;
        guardian: { id: number; name: string } | null;
        tutor: { id: number; name: string } | null;
    }>;
};

type Props = {
    role: 'guardian' | 'tutor' | 'admin';
    guardian_dashboard?: GuardianDashboardData;
    tutor_dashboard?: TutorDashboardData;
    admin_dashboard?: AdminDashboardData;
};

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    interested: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-rose-100 text-rose-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
};

export default function Dashboard({ role, guardian_dashboard, tutor_dashboard, admin_dashboard }: Props) {
    if (role === 'admin' && admin_dashboard) {
        const { stats, recent_posts, recent_applications, recent_tutor_requests } = admin_dashboard;

        return (
            <>
                <Head title="Admin Dashboard" />

                <div className="space-y-6 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard title="Guardians" value={stats.guardians} href="/admin/guardians" colorClassName="bg-sky-50 border-sky-200" />
                        <StatCard title="Tutors" value={stats.tutors} href="/admin/tutors" colorClassName="bg-emerald-50 border-emerald-200" />
                        <StatCard title="Tuition Posts" value={stats.tuitionPosts} href="/admin/tuition-posts" colorClassName="bg-violet-50 border-violet-200" />
                        <StatCard title="Applications" value={stats.applications} href="/admin/applications" colorClassName="bg-amber-50 border-amber-200" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard title="Published Posts" value={stats.publishedPosts} href="/admin/tuition-posts?status=published" colorClassName="bg-teal-50 border-teal-200" />
                        <StatCard title="Assigned Posts" value={stats.assignedPosts} href="/admin/tuition-posts?status=assigned" colorClassName="bg-orange-50 border-orange-200" />
                        <StatCard title="Pending Applications" value={stats.pendingApplications} href="/admin/applications?status=pending" colorClassName="bg-yellow-50 border-yellow-200" />
                        <StatCard title="Shortlisted Applications" value={stats.shortlistedApplications} href="/admin/applications?status=shortlisted" colorClassName="bg-blue-50 border-blue-200" />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-4">
                        <StatCard title="Hired Applications" value={stats.hiredApplications} href="/admin/applications?status=hired" colorClassName="bg-green-50 border-green-200" />
                        <StatCard title="Interested Applications" value={stats.contactInterested} href="/admin/applications?status=interested" colorClassName="bg-cyan-50 border-cyan-200" />
                        <StatCard title="Tutor Requests" value={stats.tutorRequestsPending} href="/admin/tutor-requests?status=pending" colorClassName="bg-indigo-50 border-indigo-200" />
                        <StatCard title="Commission Unpaid" value={stats.commissionUnpaid} href="/admin/commissions?payment_status=unpaid" colorClassName="bg-rose-50 border-rose-200" />
                        <StatCard title="Commission Partial" value={stats.commissionPartial} href="/admin/commissions?payment_status=partial" colorClassName="bg-fuchsia-50 border-fuchsia-200" />
                    </div>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Commission Due
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-semibold">
                            <Link href="/admin/commissions" className="hover:text-blue-600">
                                BDT {stats.commissionDueAmount.toLocaleString()}
                            </Link>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Tuition Posts</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recent_posts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No tuition posts found.</p>
                                ) : (
                                    recent_posts.map((post) => (
                                        <div key={post.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                                            <div>
                                                <Link href={`/tuition-posts/${post.id}`} className="text-sm font-medium hover:text-blue-600">
                                                    {post.title ?? `Post #${post.id}`}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {post.tuition_code ?? 'No code'} | {post.guardian?.name ?? 'Unknown guardian'} | {post.applications_count} applications
                                                </p>
                                            </div>
                                            <Link href="/admin/tuition-posts" className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize hover:bg-muted/80">
                                                {post.status}
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Applications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recent_applications.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No applications found.</p>
                                ) : (
                                    recent_applications.map((application) => (
                                        <div key={application.id} className="space-y-2 rounded-md border p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <Link href={`/admin/applications?status=${application.status}`} className="text-sm font-medium hover:text-blue-600">
                                                    {application.tutor?.name ?? 'Unknown tutor'}
                                                </Link>
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[application.status]}`}>
                                                    {application.status}
                                                </span>
                                            </div>
                                            <Link
                                                href={application.post?.tuition_code
                                                    ? `/admin/applications?tuition_code=${application.post.tuition_code}`
                                                    : '/admin/applications'}
                                                className="block text-xs text-muted-foreground hover:text-blue-600"
                                            >
                                                {application.post?.tuition_code ?? 'No code'} | {application.post?.title ?? `Post #${application.post?.id ?? '-'}`}
                                            </Link>
                                            <div className="flex gap-2">
                                                {application.commission_payment_status && (
                                                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-700">
                                                        {application.commission_payment_status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Tutor Requests</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recent_tutor_requests.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No tutor requests found.</p>
                                ) : (
                                    recent_tutor_requests.map((requestRow) => (
                                        <div key={requestRow.id} className="space-y-2 rounded-md border p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <Link href="/admin/tutor-requests" className="text-sm font-medium hover:text-blue-600">
                                                    {requestRow.tutor?.name ?? 'Unknown tutor'}
                                                </Link>
                                                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-700">
                                                    {requestRow.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {requestRow.subject ?? 'No subject'} | {requestRow.location ?? 'No location'} | {requestRow.guardian?.name ?? 'Unknown guardian'}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </>
        );
    }

    if (role === 'guardian' && guardian_dashboard) {
        const { stats, recent_posts, recent_applications } = guardian_dashboard;

        return (
            <>
                <Head title="Dashboard" />
                <div className="space-y-6 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold">Guardian Dashboard</h1>
                            <p className="text-sm text-muted-foreground">Track your tuition posts and incoming applications.</p>
                        </div>
                        <Button asChild>
                            <Link href="/guardian/tuition-posts/create">Post New Tuition</Link>
                        </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard title="Total Posts" value={stats.total_posts} href="/guardian/tuition-posts" colorClassName="bg-violet-50 border-violet-200" />
                        <StatCard title="Published Posts" value={stats.published_posts} href="/guardian/tuition-posts?status=published" colorClassName="bg-teal-50 border-teal-200" />
                        <StatCard title="All Applications" value={stats.total_applications} href="/guardian/applications" colorClassName="bg-amber-50 border-amber-200" />
                        <StatCard title="Pending Applications" value={stats.pending_applications} href="/guardian/applications?status=pending" colorClassName="bg-yellow-50 border-yellow-200" />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Tuition Posts</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recent_posts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No posts yet. Create your first tuition post.</p>
                                ) : (
                                    recent_posts.map((post) => (
                                        <div key={post.id} className="flex items-center justify-between rounded-md border p-3">
                                            <div>
                                                <Link href={`/guardian/tuition-posts/${post.id}/edit`} className="text-sm font-medium hover:text-blue-600">
                                                    {post.title ?? `Tuition Post #${post.id}`}
                                                </Link>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {post.status} · {post.applications_count} application{post.applications_count !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/guardian/tuition-posts/${post.id}/applications`}>View</Link>
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Applications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recent_applications.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No applications received yet.</p>
                                ) : (
                                    recent_applications.map((application) => (
                                        <div key={application.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                                            <div>
                                                <p className="text-sm font-medium">{application.tutor.name ?? 'Unknown Tutor'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Applied to {application.post.title ?? `Post #${application.post.id}`}
                                                </p>
                                            </div>
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[application.status]}`}
                                            >
                                                {application.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </>
        );
    }

    if (role === 'tutor' && tutor_dashboard) {
        const { stats, recent_applications } = tutor_dashboard;

        return (
            <>
                <Head title="Dashboard" />
                <div className="space-y-6 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold">Tutor Portal</h1>
                            <p className="text-sm text-muted-foreground">Track your applications and keep your profile ready for new opportunities.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard title="Total Applications" value={stats.total_applications} href="/tutor/applications" colorClassName="bg-sky-50 border-sky-200" />
                        <StatCard title="Pending Review" value={stats.pending_applications} href="/tutor/applications?status=pending" colorClassName="bg-yellow-50 border-yellow-200" />
                        <StatCard title="Shortlisted" value={stats.shortlisted_applications} href="/tutor/applications?status=shortlisted" colorClassName="bg-blue-50 border-blue-200" />
                        <StatCard title="Hired" value={stats.hired_applications} href="/tutor/applications?status=hired" colorClassName="bg-green-50 border-green-200" />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Applications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recent_applications.length === 0 ? (
                                <p className="text-sm text-muted-foreground">You have not applied yet. Explore current tuition posts and apply to relevant ones.</p>
                            ) : (
                                recent_applications.map((application) => (
                                    <div key={application.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                                        <div>
                                            {application.post.id && application.post.status === 'published' ? (
                                                <Link
                                                    href={`/tuition-posts/${application.post.id}`}
                                                    className="text-sm font-medium hover:text-blue-600"
                                                >
                                                    {application.post.title ?? `Tuition Post #${application.post.id}`}
                                                </Link>
                                            ) : (
                                                <p className="text-sm font-medium">
                                                    {application.post.title ?? `Tuition Post #${application.post.id ?? application.id}`}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Applied {new Date(application.created_at).toLocaleDateString('en-BD', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                {application.expected_salary ? ` - Expected salary ${application.expected_salary.toLocaleString()}` : ''}
                                                {application.post.status && application.post.status !== 'published'
                                                    ? ` - Post is ${application.post.status}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[application.status]}`}
                                        >
                                            {application.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-4 p-4">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    {role === 'admin'
                        ? 'Open the admin dashboard from the sidebar for platform-wide stats.'
                        : 'Use the sidebar to manage your account activity.'}
                </div>
            </div>
        </>
    );
}

function StatCard({
    title,
    value,
    href,
    colorClassName,
}: {
    title: string;
    value: number;
    href?: string;
    colorClassName?: string;
}) {
    const isClickable = Boolean(href) && value > 0;

    return (
        <Card className={colorClassName}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
                {isClickable ? (
                    <Link href={href} className="hover:text-blue-600">
                        {value}
                    </Link>
                ) : (
                    <span className={href ? 'text-muted-foreground' : ''}>{value}</span>
                )}
            </CardContent>
        </Card>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard.url(),
        },
    ],
};
