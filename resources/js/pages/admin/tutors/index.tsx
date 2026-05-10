import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, UserCircle, SearchX, X } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import Select from 'react-select';

type Tutor = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    gender: string | null;
    has_profile: boolean;
    university: string | null;
    applications_count: number;
    applications_by_status: {
        pending: number;
        shortlisted: number;
        hired: number;
        rejected: number;
    };
    created_at: string;
};

type Props = {
    tutors: {
        data: Tutor[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: { search: string; gender: string; university: string };
    universities: { id: number; name: string }[];
    genders: string[];
};

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    hired: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

const SELECT_STYLES = {
    control: (base: object) => ({ ...base, backgroundColor: 'var(--background)', borderColor: 'var(--border)', minHeight: '40px' }),
    menu: (base: object) => ({ ...base, backgroundColor: 'var(--background)', zIndex: 50 }),
    option: (base: object, state: { isFocused: boolean }) => ({
        ...base,
        backgroundColor: state.isFocused ? 'var(--accent)' : 'var(--background)',
        color: 'var(--foreground)',
    }),
    singleValue: (base: object) => ({ ...base, color: 'var(--foreground)' }),
    input: (base: object) => ({ ...base, color: 'var(--foreground)' }),
};

export default function AdminTutorsIndex({ tutors, filters, universities, genders }: Props) {
    const { url } = usePage();
    const formatDate = (value: string) => new Date(value).toISOString().slice(0, 10);
    const [search, setSearch] = useState(filters.search);
    const [gender, setGender] = useState(filters.gender);
    const [university, setUniversity] = useState(filters.university);
    const [isLoading, setIsLoading] = useState(false);
    const [, startTransition] = useTransition();
    const hasMountedRef = useRef(false);
    const returnTo = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : url;

    const clearAllFilters = () => {
        setSearch('');
        setGender('');
        setUniversity('');
    };

    useEffect(() => {
        const hasFilterChanged = search !== filters.search || gender !== filters.gender || university !== filters.university;

        if (!hasMountedRef.current) {
            hasMountedRef.current = true;

            return;
        }

        if (!hasFilterChanged) {
            return;
        }

        // Only trigger search if search term is 3+ characters or empty
        if (search.length > 0 && search.length < 3) {
            return;
        }

        setIsLoading(true);
        const timeout = setTimeout(() => {
            startTransition(() => {
                router.get(
                    '/admin/tutors',
                    {
                        search: search || undefined,
                        gender: gender || undefined,
                        university: university || undefined,
                    },
                    {
                        preserveState: true,
                        replace: true,
                        onSuccess: () => setIsLoading(false),
                        onError: () => setIsLoading(false),
                    }
                );
            });
        }, 200);

        return () => clearTimeout(timeout);
    }, [search, gender, university]);

    return (
        <>
            <Head title="Admin Tutors" />

            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Tutor Management</h1>
                </div>


                <div className="flex items-end gap-4">
                <div className="grid flex-1 gap-4 md:grid-cols-4">
                    <div>
                        <label htmlFor="search" className="mb-2 block text-sm font-medium">
                            Search {search.length > 0 && search.length < 3 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                    (min 3 characters)
                                </span>
                            )}
                        </label>
                        <Input
                            id="search"
                            placeholder="Search by name, email, phone"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="gender" className="mb-2 block text-sm font-medium">
                            Filter by gender
                        </label>
                        <select
                            id="gender"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={gender}
                            onChange={(event) => setGender(event.target.value)}
                        >
                            <option value="">All genders</option>
                            {genders.map((gender) => (
                                <option key={gender} value={gender}>
                                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="university" className="mb-2 block text-sm font-medium">
                            Filter by university
                        </label>
                        <Select
                            inputId="university"
                            value={university ? { value: university, label: university } : null}
                            onChange={(selected) => setUniversity(selected?.value || '')}
                            options={universities.map((univ) => ({ value: univ.name, label: univ.name }))}
                            placeholder="All universities"
                            isClearable
                            isSearchable
                            styles={SELECT_STYLES}
                        />
                    </div>
                </div>
                    {(search || gender || university) && (
                        <button
                            type="button"
                            onClick={clearAllFilters}
                            className="mb-0.5 flex h-10 shrink-0 items-center gap-1.5 self-end rounded-md border px-3 text-sm text-muted-foreground hover:bg-muted"
                            title="Clear filters"
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left">Tutor</th>
                                <th className="px-4 py-3 text-left">Contact</th>
                                <th className="px-4 py-3 text-left">Gender</th>
                                <th className="px-4 py-3 text-left">Profile</th>
                                <th className="px-4 py-3 text-left">Total Applications</th>
                                <th className="px-4 py-3 text-left">University</th>
                                <th className="px-4 py-3 text-left">Created</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-9 w-9 rounded-full" />
                                                <div className="space-y-1.5">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-40" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Skeleton className="h-4 w-24" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Skeleton className="h-4 w-16" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Skeleton className="h-5 w-16" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Skeleton className="h-4 w-8" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Skeleton className="h-4 w-24" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Skeleton className="h-4 w-20" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Skeleton className="h-4 w-24" />
                                        </td>
                                    </tr>
                                ))
                            ) : tutors.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <SearchX className="h-8 w-8 text-muted-foreground/50" />
                                            <span>No tutors found matching your filters.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tutors.data.map((tutor) => (
                                    <tr key={tutor.id} className="border-t">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{tutor.name}</p>
                                                    <p className="text-xs text-muted-foreground">{tutor.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{tutor.phone || '-' }</td>
                                        <td className="px-4 py-3 capitalize">{tutor.gender || '-' }</td>
                                        <td className="px-4 py-3">
                                            {tutor.has_profile ? (
                                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                                    Complete
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                                                    Incomplete
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium">{tutor.applications_count}</td>
                                        <td className="px-4 py-3">{tutor.university || '-' }</td>
                                        <td className="px-4 py-3">{formatDate(tutor.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/admin/tutors/${tutor.id}?return_to=${encodeURIComponent(returnTo)}`}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                                    aria-label={`View profile of ${tutor.name}`}
                                                    title="View Profile"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {tutors.links.length > 3 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {tutors.links.map((link, index) => (
                            <Link
                                key={`${link.label}-${index}`}
                                href={link.url ?? '#'}
                                preserveState
                                preserveScroll
                                className={`rounded border px-3 py-1 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'bg-background'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

AdminTutorsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Tutors',
            href: '/admin/tutors',
        },
    ],
};
