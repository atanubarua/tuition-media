import { Head, Link, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, SearchX, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

type Guardian = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    tuition_posts_count: number;
    created_at: string;
};

type Props = {
    guardians: {
        data: Guardian[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    filters: { name: string; email: string; phone: string };
};

export default function AdminGuardiansIndex({ guardians, filters }: Props) {
    const [name, setName] = useState(filters.name);
    const [email, setEmail] = useState(filters.email);
    const [phone, setPhone] = useState(filters.phone);
    const [loading, setLoading] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [editingGuardianId, setEditingGuardianId] = useState<number | null>(null);
    const hasMountedRef = useRef(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const formatDate = (value: string) => new Date(value).toISOString().slice(0, 10);
    const isModalOpen = modalMode !== null;
    const isEdit = modalMode === 'edit';

    const clearFilters = () => {
        setName('');
        setEmail('');
        setPhone('');
    };

    const openCreateModal = () => {
        setModalMode('create');
        setEditingGuardianId(null);
        reset();
        clearErrors();
    };

    const openEditModal = (guardian: Guardian) => {
        setModalMode('edit');
        setEditingGuardianId(guardian.id);
        setData({
            name: guardian.name,
            email: guardian.email,
            phone: guardian.phone ?? '',
            password: '',
            password_confirmation: '',
        });
        clearErrors();
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingGuardianId(null);
        reset();
        clearErrors();
    };

    const submitGuardian = (event: FormEvent) => {
        event.preventDefault();

        if (isEdit && editingGuardianId) {
            put(`/admin/guardians/${editingGuardianId}`, {
                preserveScroll: true,
                onSuccess: closeModal,
            });
            return;
        }

        post('/admin/guardians', {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    const deleteGuardian = (guardian: Guardian) => {
        if (!confirm(`Delete guardian "${guardian.name}"? This will also delete related tuition posts.`)) {
            return;
        }

        router.delete(`/admin/guardians/${guardian.id}`);
    };

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        setLoading(true);
        const timeout = setTimeout(() => {
            router.get(
                '/admin/guardians',
                {
                    name: name || undefined,
                    email: email || undefined,
                    phone: phone || undefined,
                },
                { preserveState: true, replace: true, onFinish: () => setLoading(false) }
            );
        }, 250);

        return () => clearTimeout(timeout);
    }, [name, email, phone]);

    return (
        <>
            <Head title="Admin Guardians" />

            <div className="space-y-6 p-4">
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-2xl font-semibold">Guardian Management</h1>
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Guardian
                    </Button>
                </div>

                <div className="flex items-end gap-4">
                <div className="grid flex-1 gap-4 md:grid-cols-3">
                    <div>
                        <label htmlFor="name" className="mb-2 block text-sm font-medium">
                            Filter by name
                        </label>
                        <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Rahim" />
                    </div>
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium">
                            Filter by email
                        </label>
                        <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="e.g. user@mail.com" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                            Filter by phone
                        </label>
                        <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="e.g. 017XXXXXXXX" />
                    </div>
                </div>
                    {(name || email || phone) && (
                        <button
                            type="button"
                            onClick={clearFilters}
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
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-left">Email</th>
                                <th className="px-4 py-3 text-left">Phone</th>
                                <th className="px-4 py-3 text-left">Tuition Posts</th>
                                <th className="px-4 py-3 text-left">Created</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : guardians.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <SearchX className="h-8 w-8 text-muted-foreground/50" />
                                            <span>No guardians found matching your filters.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                guardians.data.map((guardian) => (
                                    <tr key={guardian.id} className="border-t">
                                        <td className="px-4 py-3 font-medium">{guardian.name}</td>
                                        <td className="px-4 py-3">{guardian.email}</td>
                                        <td className="px-4 py-3">{guardian.phone || '-'}</td>
                                        <td className="px-4 py-3">{guardian.tuition_posts_count}</td>
                                        <td className="px-4 py-3">{formatDate(guardian.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(guardian)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                                    title="Edit guardian"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteGuardian(guardian)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-rose-600 transition-colors hover:bg-rose-50"
                                                    title="Delete guardian"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {guardians.links.length > 3 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {guardians.links.map((link, index) => (
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

            <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Edit Guardian' : 'Add Guardian'}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? 'Update guardian information.' : 'Create a new guardian account.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitGuardian} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="guardian-name">Name</Label>
                            <Input
                                id="guardian-name"
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guardian-email">Email</Label>
                            <Input
                                id="guardian-email"
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guardian-phone">Phone</Label>
                            <Input
                                id="guardian-phone"
                                value={data.phone}
                                onChange={(event) => setData('phone', event.target.value)}
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guardian-password">{isEdit ? 'New Password (optional)' : 'Password'}</Label>
                            <Input
                                id="guardian-password"
                                type="password"
                                minLength={4}
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guardian-password-confirmation">
                                {isEdit ? 'Confirm New Password' : 'Confirm Password'}
                            </Label>
                            <Input
                                id="guardian-password-confirmation"
                                type="password"
                                minLength={4}
                                value={data.password_confirmation}
                                onChange={(event) => setData('password_confirmation', event.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {isEdit ? 'Update Guardian' : 'Create Guardian'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminGuardiansIndex.layout = {
    breadcrumbs: [
        {
            title: 'Guardians',
            href: '/admin/guardians',
        },
    ],
};
