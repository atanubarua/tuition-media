import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
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
        status: 'pending' | 'shortlisted' | 'rejected' | 'hired';
        admin_contact_status: 'new' | 'contacted' | 'interested' | 'not_interested';
        commission_payment_status: 'unpaid' | 'partial' | 'paid' | null;
        created_at: string;
        post: { id: number; tuition_code: string | null; title: string | null } | null;
        tutor: { id: number; name: string } | null;
    }>;
};

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
};

const CONTACT_STATUS_STYLES = {
    new: 'bg-slate-100 text-slate-700',
    contacted: 'bg-indigo-100 text-indigo-700',
    interested: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-rose-100 text-rose-700',
};

export default function AdminDashboard({ stats, recent_posts, recent_applications }: Props) {
    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Platform snapshot with hiring and commission pipeline.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/tuition-posts">Tuition Posts</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/applications">Applications</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/commissions">Commissions</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Guardians" value={stats.guardians} />
                    <StatCard title="Tutors" value={stats.tutors} />
                    <StatCard title="Tuition Posts" value={stats.tuitionPosts} href="/admin/tuition-posts" />
                    <StatCard title="Applications" value={stats.applications} href="/admin/applications" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Published Posts" value={stats.publishedPosts} href="/admin/tuition-posts" />
                    <StatCard title="Assigned Posts" value={stats.assignedPosts} href="/admin/tuition-posts" />
                    <StatCard title="Pending Applications" value={stats.pendingApplications} href="/admin/applications?status=pending" />
                    <StatCard title="Shortlisted Applications" value={stats.shortlistedApplications} href="/admin/applications?status=shortlisted" />
                </div>

                <div className="grid gap-4 xl:grid-cols-4">
                    <StatCard title="Hired Applications" value={stats.hiredApplications} href="/admin/applications?status=hired" />
                    <StatCard title="Contacted & Interested" value={stats.contactInterested} href="/admin/applications?status=shortlisted" />
                    <StatCard title="Commission Unpaid" value={stats.commissionUnpaid} href="/admin/commissions" />
                    <StatCard title="Commission Partial" value={stats.commissionPartial} href="/admin/commissions" />
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Commission Due
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-semibold">
                        BDT {stats.commissionDueAmount.toLocaleString()}
                    </CardContent>
                </Card>

                <div className="grid gap-4 xl:grid-cols-2">
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
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CONTACT_STATUS_STYLES[application.admin_contact_status]}`}>
                                                {application.admin_contact_status.replace('_', ' ')}
                                            </span>
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
                </div>
            </div>
        </>
    );
}

function StatCard({ title, value, href }: { title: string; value: number; href?: string }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
                {href ? (
                    <Link href={href} className="hover:text-blue-600">
                        {value}
                    </Link>
                ) : (
                    value
                )}
            </CardContent>
        </Card>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Admin Dashboard',
            href: '/admin/dashboard',
        },
    ],
};
