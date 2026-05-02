import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Post = {
    id: number;
    title: string | null;
    status: string;
    salary_type: string;
    salary_min: number | null;
    salary_max: number | null;
    days_per_week: number;
    students_count: number;
    applications_count: number;
};

export default function TuitionPostIndex({ posts }: { posts: Post[] }) {
    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete this tuition post?')) {
            return;
        }

        router.delete(`/guardian/tuition-posts/${id}`);
    };

    return (
        <>
            <Head title="My Tuition Posts" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">My Tuition Posts</h1>
                        <p className="text-sm text-muted-foreground">Manage your posted tuition jobs.</p>
                    </div>
                    <Button asChild>
                        <Link href="/guardian/tuition-posts/create">Post Tuition Job</Link>
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Salary</th>
                                <th className="px-4 py-3 text-left">Days/Week</th>
                                <th className="px-4 py-3 text-left">Students</th>
                                <th className="px-4 py-3 text-left">Applications</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                                        No tuition post yet.
                                    </td>
                                </tr>
                            )}
                            {posts.map((post) => (
                                <tr key={post.id} className="border-t">
                                    <td className="px-4 py-3">{post.title || `Tuition Post #${post.id}`}</td>
                                    <td className="px-4 py-3 capitalize">{post.status}</td>
                                    <td className="px-4 py-3">
                                        {post.salary_type === 'fixed' && post.salary_min ? `BDT ${post.salary_min}` : null}
                                        {post.salary_type === 'range' && post.salary_min && post.salary_max
                                            ? `BDT ${post.salary_min} - ${post.salary_max}`
                                            : null}
                                        {post.salary_type === 'negotiable' ? 'Negotiable' : null}
                                    </td>
                                    <td className="px-4 py-3">{post.days_per_week}</td>
                                    <td className="px-4 py-3">{post.students_count}</td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/guardian/tuition-posts/${post.id}/applications`}
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            {post.applications_count} application{post.applications_count !== 1 ? 's' : ''}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/tuition-posts/${post.id}`}>
                                                            <Eye className="size-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>View details</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/guardian/tuition-posts/${post.id}/edit`}>
                                                            <Pencil className="size-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Edit</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(post.id)}>
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Delete</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

TuitionPostIndex.layout = {
    breadcrumbs: [
        {
            title: 'My Tuition Posts',
            href: '/guardian/tuition-posts',
        },
    ],
};
