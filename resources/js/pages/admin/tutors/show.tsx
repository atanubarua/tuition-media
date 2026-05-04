import { Head, Link } from '@inertiajs/react';
import { UserCircle, FileText, Briefcase, GraduationCap, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    hired: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-emerald-100 text-emerald-700',
};

type Subject = { id: number; name: string };
type Location = { id: number; name: string };

type Tutor = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    gender: string | null;
    created_at: string;
    profile: {
        occupation: string;
        job_title: string | null;
        job_organization: string | null;
        university: string | null;
        department: string;
        academic_year: number;
        intake_year: number;
        teachable_levels: string[];
        teachable_mediums: string[];
        experience_months: number;
        bio: string | null;
        profile_photo: string | null;
        is_verified: boolean;
        subjects: Subject[];
        preferred_locations: Location[];
    } | null;
};

type RecentApplication = {
    id: number;
    status: string;
    expected_salary: number | null;
    created_at: string;
    post: {
        id: number;
        tuition_code: string | null;
        title: string | null;
        status: string;
    } | null;
};

type ApplicationSummary = {
    total: number;
    pending: number;
    shortlisted: number;
    hired: number;
    rejected: number;
};

type Props = {
    tutor: Tutor;
    recent_applications: RecentApplication[];
    application_summary: ApplicationSummary;
};

export default function AdminTutorShow({ tutor, recent_applications, application_summary }: Props) {
    const formatDate = (value: string) => new Date(value).toISOString().slice(0, 10);

    return (
        <>
            <Head title={`Tutor: ${tutor.name}`} />

            <div className="space-y-6 p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{tutor.name}</h1>
                        <p className="text-sm text-muted-foreground">{tutor.email}</p>
                    </div>
                    <Link href={`/admin/tutors`}>
                        <Button variant="outline">Back to Tutors</Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Personal Information */}
                    <div className="rounded-lg border p-4">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <UserCircle className="h-5 w-5" />
                            Personal Information
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email</span>
                                <span>{tutor.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Phone</span>
                                <span>{tutor.phone || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Gender</span>
                                <span className="capitalize">{tutor.gender || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Member Since</span>
                                <span>{formatDate(tutor.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Profile Status</span>
                                <span>
                                    {tutor.profile ? (
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                            Complete
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                                            Incomplete
                                        </Badge>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Application Summary */}
                    <div className="rounded-lg border p-4">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <FileText className="h-5 w-5" />
                            Application Summary
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-md bg-muted/30 p-3 text-center">
                                <p className="text-2xl font-bold">{application_summary.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                            <div className="rounded-md bg-amber-50 p-3 text-center">
                                <p className="text-2xl font-bold text-amber-700">{application_summary.pending}</p>
                                <p className="text-xs text-amber-700">Pending</p>
                            </div>
                            <div className="rounded-md bg-blue-50 p-3 text-center">
                                <p className="text-2xl font-bold text-blue-700">{application_summary.shortlisted}</p>
                                <p className="text-xs text-blue-700">Shortlisted</p>
                            </div>
                            <div className="rounded-md bg-green-50 p-3 text-center">
                                <p className="text-2xl font-bold text-green-700">{application_summary.hired}</p>
                                <p className="text-xs text-green-700">Hired</p>
                            </div>
                            <div className="rounded-md bg-red-50 p-3 text-center">
                                <p className="text-2xl font-bold text-red-700">{application_summary.rejected}</p>
                                <p className="text-xs text-red-700">Rejected</p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    {tutor.profile && (
                        <>
                            {/* Professional Information */}
                            <div className="rounded-lg border p-4">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                    <Briefcase className="h-5 w-5" />
                                    Professional Information
                                </h2>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Occupation</span>
                                        <span className="capitalize">{tutor.profile.occupation}</span>
                                    </div>
                                    {tutor.profile.job_title && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Job Title</span>
                                            <span>{tutor.profile.job_title}</span>
                                        </div>
                                    )}
                                    {tutor.profile.job_organization && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Organization</span>
                                            <span>{tutor.profile.job_organization}</span>
                                        </div>
                                    )}
                                    {tutor.profile.university && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">University</span>
                                            <span>{tutor.profile.university}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Department</span>
                                        <span>{tutor.profile.department}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Academic Year</span>
                                        <span>{tutor.profile.academic_year}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Intake Year</span>
                                        <span>{tutor.profile.intake_year}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Experience</span>
                                        <span>{tutor.profile.experience_months} months</span>
                                    </div>
                                    {tutor.profile.bio && (
                                        <div className="pt-2">
                                            <span className="text-muted-foreground">Bio</span>
                                            <p className="mt-1 text-foreground">{tutor.profile.bio}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Teaching Details */}
                            <div className="rounded-lg border p-4">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                    <GraduationCap className="h-5 w-5" />
                                    Teaching Details
                                </h2>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Teachable Levels</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {tutor.profile.teachable_levels.map((level) => (
                                                <Badge key={level} variant="secondary" className="capitalize">
                                                    {level.replace('_', ' ')}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Teachable Mediums</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {tutor.profile.teachable_mediums.map((medium) => (
                                                <Badge key={medium} variant="secondary" className="capitalize">
                                                    {medium}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Subjects</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {tutor.profile.subjects.map((subject) => (
                                                <Badge key={subject.id} variant="outline">
                                                    {subject.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Preferred Locations</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {tutor.profile.preferred_locations.map((loc) => (
                                                <Badge key={loc.id} variant="outline" className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {loc.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Recent Applications */}
                <div className="rounded-lg border">
                    <div className="border-b bg-muted/40 p-4">
                        <h2 className="text-lg font-semibold">Recent Applications</h2>
                    </div>
                    <div className="p-4">
                        {recent_applications.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No applications submitted yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {recent_applications.map((application) => (
                                    application.post ? (
                                        <Link
                                            key={application.id}
                                            href={`/tuition-posts/${application.post.id}`}
                                            className="block rounded-md border p-3 transition-colors hover:bg-muted/30"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium">
                                                        {application.post.title || `Tuition Post #${application.post.id}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {application.post.tuition_code}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={STATUS_STYLES[application.status] ?? 'bg-gray-100 text-gray-700'}
                                                    >
                                                        {application.status}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(application.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            {application.expected_salary && (
                                                <p className="mt-2 text-sm">
                                                    <span className="text-muted-foreground">Expected:</span> BDT {application.expected_salary}
                                                </p>
                                            )}
                                        </Link>
                                    ) : (
                                        <div key={application.id} className="rounded-md border p-3 text-sm text-muted-foreground">
                                            Application record exists but tuition post is missing
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

AdminTutorShow.layout = {
    breadcrumbs: [
        {
            title: 'Tutors',
            href: '/admin/tutors',
        },
        {
            title: 'Details',
            href: '#',
        },
    ],
};
