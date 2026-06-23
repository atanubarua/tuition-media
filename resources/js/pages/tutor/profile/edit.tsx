import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import ReactSelect from 'react-select';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { update } from '@/routes/tutor/profile';
import type { User } from '@/types';

type Option = { id: number; name: string; type?: string; district_id?: number; group_name?: string };

type ProfileShape = {
    occupation: 'student' | 'employed' | 'other';
    job_title: string;
    job_organization: string;
    university_id: number | null;
    department: string;
    academic_year: number | null;
    intake_year: number | null;
    teachable_classes: string[];
    teachable_groups: string[];
    teachable_mediums: string[];
    subject_ids: number[];
    preferred_location_ids: number[];
    experience_months: number | string;
    bio: string;
};

const CLASS_OPTIONS = [
    { value: 'nursery', label: 'Nursery' },
    { value: 'kg', label: 'KG' },
    ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` })),
];

const GROUP_OPTIONS = [
    { value: 'science', label: 'Science' },
    { value: 'commerce', label: 'Commerce' },
    { value: 'arts', label: 'Arts' },
];

const MEDIUMS = [
    { value: 'bangla', label: 'Bangla Medium' },
    { value: 'english', label: 'English Medium' },
    { value: 'madrasha', label: 'Madrasha' },
    { value: 'other', label: 'Other' },
];

const ACADEMIC_YEARS = [
    { value: 1, label: '1st Year' },
    { value: 2, label: '2nd Year' },
    { value: 3, label: '3rd Year' },
    { value: 4, label: '4th Year' },
    { value: 5, label: 'Graduated' },
];

const currentYear = new Date().getFullYear();
const INTAKE_YEAR_OPTIONS = Array.from({ length: currentYear - 1989 }, (_, i) => ({
    value: currentYear - i,
    label: String(currentYear - i),
}));

const SELECT_STYLES = {
    control: (base: object) => ({ ...base, backgroundColor: 'var(--background)', borderColor: 'var(--border)', minHeight: '38px' }),
    menu: (base: object) => ({ ...base, backgroundColor: 'var(--background)', zIndex: 50 }),
    option: (base: object, state: { isFocused: boolean }) => ({
        ...base,
        backgroundColor: state.isFocused ? 'var(--accent)' : 'var(--background)',
        color: 'var(--foreground)',
    }),
    multiValue: (base: object) => ({ ...base, backgroundColor: 'var(--accent)' }),
    singleValue: (base: object) => ({ ...base, color: 'var(--foreground)' }),
    input: (base: object) => ({ ...base, color: 'var(--foreground)' }),
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {children}
        </div>
    );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-medium">{value}</p>
        </div>
    );
}

export default function TutorProfileEdit({
    profile,
    universities,
    subjects,
    districts,
    subdistricts,
}: {
    profile: (ProfileShape & { id?: number }) | null;
    universities: Option[];
    subjects: Option[];
    districts: Option[];
    subdistricts: Option[];
}) {
    const { auth } = usePage().props as { auth: { user: User } };

    const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
        profile?.preferred_location_ids?.length
            ? (subdistricts.find((s) => profile.preferred_location_ids.includes(s.id))?.district_id ?? null)
            : null,
    );

    const { data, setData, put, processing, errors } = useForm<ProfileShape>({
        occupation: profile?.occupation ?? 'student',
        job_title: profile?.job_title ?? '',
        job_organization: profile?.job_organization ?? '',
        university_id: profile?.university_id ?? null,
        department: profile?.department ?? '',
        academic_year: profile?.academic_year ?? null,
        intake_year: profile?.intake_year ?? null,
        teachable_classes: profile?.teachable_classes ?? [],
        teachable_groups: profile?.teachable_groups ?? [],
        teachable_mediums: profile?.teachable_mediums ?? [],
        subject_ids: profile?.subject_ids ?? [],
        preferred_location_ids: profile?.preferred_location_ids ?? [],
        experience_months: profile?.experience_months ?? '',
        bio: profile?.bio ?? '',
    });

    const universityOptions = universities.map((u) => ({ value: u.id, label: u.name }));
    const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
    const districtOptions = districts.map((d) => ({ value: d.id, label: d.name }));
    const filteredSubdistricts = selectedDistrictId ? subdistricts.filter((s) => s.district_id === selectedDistrictId) : [];
    const subdistrictOptions = filteredSubdistricts.map((s) => ({ value: s.id, label: s.type ? `${s.name} (${s.type})` : s.name }));

    const experienceLabel = (() => {
        const months = Number(data.experience_months);

        if (!months) {
            return null;
        }

        const y = Math.floor(months / 12);
        const m = months % 12;

        return [y > 0 && `${y} yr`, m > 0 && `${m} mo`].filter(Boolean).join(' ');
    })();

    const toggleCheckbox = (field: 'teachable_classes' | 'teachable_groups' | 'teachable_mediums', value: string) => {
        const current = data[field] as string[];
        setData(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
    };

    const hasSeniorClasses = data.teachable_classes.some((value) => ['9', '10', '11', '12'].includes(value));

    useEffect(() => {
        if (!hasSeniorClasses && data.teachable_groups.length > 0) {
            setData('teachable_groups', []);
        }
    }, [hasSeniorClasses, data.teachable_groups.length, setData]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(update.url());
    };

    return (
        <>
            <Head title="My Profile" />
            <div className="p-4 md:p-6 space-y-5">
                <div>
                    <h1 className="text-2xl font-semibold">My Profile</h1>
                    <p className="text-sm text-muted-foreground mt-1">Complete your profile to apply for tuition jobs.</p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <SectionCard title="Basic Information">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <ReadonlyField label="Name" value={auth.user.name} />
                            <ReadonlyField label="Email" value={auth.user.email} />
                            <ReadonlyField label="Phone" value={auth.user.phone} />
                            <ReadonlyField label="Gender" value={auth.user.gender ?? '—'} />
                        </div>
                    </SectionCard>

                    <SectionCard title="Graduation">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="lg:col-span-2">
                                <Label>
                                    University <span className="text-destructive">*</span>
                                </Label>
                                <ReactSelect
                                    instanceId="university"
                                    isClearable
                                    isSearchable
                                    styles={SELECT_STYLES}
                                    options={universityOptions}
                                    value={universityOptions.find((o) => o.value === data.university_id) ?? null}
                                    onChange={(opt) => setData('university_id', opt?.value ?? null)}
                                    placeholder="Search university..."
                                    className="mt-1"
                                />
                                <InputError message={errors.university_id} />
                            </div>
                            <div>
                                <Label>
                                    Department <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    className="mt-1"
                                    value={data.department}
                                    onChange={(e) => setData('department', e.target.value)}
                                    placeholder="e.g. CSE"
                                />
                                <InputError message={errors.department} />
                            </div>
                            <div>
                                <Label>
                                    Intake Year <span className="text-destructive">*</span>
                                </Label>
                                <ReactSelect
                                    instanceId="intake-year"
                                    isClearable
                                    styles={SELECT_STYLES}
                                    options={INTAKE_YEAR_OPTIONS}
                                    value={INTAKE_YEAR_OPTIONS.find((o) => o.value === data.intake_year) ?? null}
                                    onChange={(opt) => setData('intake_year', opt?.value ?? null)}
                                    placeholder="Year..."
                                    className="mt-1"
                                />
                                <InputError message={errors.intake_year} />
                            </div>
                            <div>
                                <Label>
                                    Current Year <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    className="mt-1 h-[38px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={data.academic_year ?? ''}
                                    onChange={(e) => setData('academic_year', e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">Select...</option>
                                    {ACADEMIC_YEARS.map((y) => (
                                        <option key={y.value} value={y.value}>
                                            {y.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.academic_year} />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Occupation">
                        <div>
                            <Label>
                                Current Status <span className="text-destructive">*</span>
                            </Label>
                            <div className="mt-2 inline-grid grid-cols-3 rounded-lg border p-1 text-sm font-medium">
                                {(['student', 'employed', 'other'] as const).map((occ) => (
                                    <button
                                        key={occ}
                                        type="button"
                                        onClick={() => setData('occupation', occ)}
                                        className={`rounded-md px-5 py-1.5 capitalize transition-colors ${data.occupation === occ ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {occ}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {data.occupation === 'employed' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>
                                        Designation <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        className="mt-1"
                                        value={data.job_title}
                                        onChange={(e) => setData('job_title', e.target.value)}
                                        placeholder="e.g. Software Engineer"
                                    />
                                    <InputError message={errors.job_title} />
                                </div>
                                <div>
                                    <Label>
                                        Company / Organization <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        className="mt-1"
                                        value={data.job_organization}
                                        onChange={(e) => setData('job_organization', e.target.value)}
                                        placeholder="e.g. BRAC"
                                    />
                                    <InputError message={errors.job_organization} />
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard title="Teaching Capability">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                                <Label>
                                    Classes I Can Teach <span className="text-destructive">*</span>
                                </Label>
                                <div className="mt-3 grid gap-2 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-2">
                                    {CLASS_OPTIONS.map((level) => (
                                        <label
                                            key={level.value}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-border hover:bg-background"
                                        >
                                            <Checkbox
                                                checked={data.teachable_classes.includes(level.value)}
                                                onCheckedChange={() => toggleCheckbox('teachable_classes', level.value)}
                                            />
                                            <span>{level.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.teachable_classes} />
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-3">
                                    <Label>Groups I Can Teach</Label>
                                    {!hasSeniorClasses && (
                                        <span className="text-xs text-muted-foreground">Available after selecting class 9-12</span>
                                    )}
                                </div>
                                <div className={`mt-3 grid gap-2 rounded-2xl border p-4 sm:grid-cols-1 ${hasSeniorClasses ? 'bg-muted/20' : 'bg-muted/10'}`}>
                                    {GROUP_OPTIONS.map((group) => (
                                        <label
                                            key={group.value}
                                            className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                                                hasSeniorClasses ? 'cursor-pointer hover:bg-background' : 'cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            <Checkbox
                                                checked={data.teachable_groups.includes(group.value)}
                                                onCheckedChange={() => hasSeniorClasses && toggleCheckbox('teachable_groups', group.value)}
                                                disabled={!hasSeniorClasses}
                                            />
                                            <span>{group.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Groups are only required when you teach class 9-12.
                                </p>
                                <InputError message={errors.teachable_groups} />
                            </div>
                        </div>

                        <div>
                            <Label>
                                Mediums <span className="text-destructive">*</span>
                            </Label>
                            <div className="mt-3 grid gap-2 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
                                {MEDIUMS.map((medium) => (
                                    <label
                                        key={medium.value}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-border hover:bg-background"
                                    >
                                        <Checkbox
                                            checked={data.teachable_mediums.includes(medium.value)}
                                            onCheckedChange={() => toggleCheckbox('teachable_mediums', medium.value)}
                                        />
                                        <span>{medium.label}</span>
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.teachable_mediums} />
                        </div>

                        <div>
                            <Label>
                                Subjects I Can Teach <span className="text-destructive">*</span>
                            </Label>
                            <ReactSelect
                                instanceId="subjects"
                                isMulti
                                isSearchable
                                styles={SELECT_STYLES}
                                options={subjectOptions}
                                value={subjectOptions.filter((o) => data.subject_ids.includes(o.value))}
                                onChange={(selected) => setData('subject_ids', selected.map((o) => o.value))}
                                placeholder="Search and select subjects..."
                                className="mt-1"
                            />
                            <InputError message={errors.subject_ids} />
                        </div>
                    </SectionCard>

                    <SectionCard title="Preferred Teaching Locations">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Filter by District</Label>
                                <ReactSelect
                                    instanceId="district"
                                    isClearable
                                    isSearchable
                                    styles={SELECT_STYLES}
                                    options={districtOptions}
                                    value={districtOptions.find((o) => o.value === selectedDistrictId) ?? null}
                                    onChange={(opt) => {
                                        setSelectedDistrictId(opt?.value ?? null);
                                        setData('preferred_location_ids', []);
                                    }}
                                    placeholder="Select district..."
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>
                                    Areas (Upazila / Thana) <span className="text-destructive">*</span>
                                </Label>
                                <ReactSelect
                                    instanceId="subdistricts"
                                    isMulti
                                    isSearchable
                                    styles={SELECT_STYLES}
                                    options={subdistrictOptions}
                                    value={subdistrictOptions.filter((o) => data.preferred_location_ids.includes(o.value))}
                                    onChange={(selected) => setData('preferred_location_ids', selected.map((o) => o.value))}
                                    placeholder={selectedDistrictId ? 'Select areas...' : 'Select a district first'}
                                    isDisabled={!selectedDistrictId}
                                    className="mt-1"
                                />
                                <InputError message={errors.preferred_location_ids} />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Experience & Bio">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label>
                                    Teaching Experience <span className="text-muted-foreground">(optional)</span>
                                </Label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={600}
                                        value={data.experience_months}
                                        onChange={(e) => setData('experience_months', e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Leave blank if you have none"
                                        className="w-56"
                                    />
                                    <span className="text-sm text-muted-foreground shrink-0">{experienceLabel ?? 'months'}</span>
                                </div>
                                <InputError message={errors.experience_months} />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label>Bio</Label>
                                <span className="text-xs text-muted-foreground">{data.bio.length}/1000</span>
                            </div>
                            <textarea
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                                rows={4}
                                maxLength={1000}
                                value={data.bio}
                                onChange={(e) => setData('bio', e.target.value)}
                                placeholder="Tell guardians about yourself, your teaching style, achievements..."
                            />
                            <InputError message={errors.bio} />
                        </div>
                    </SectionCard>

                    <div className="flex justify-end pb-6">
                        <Button type="submit" disabled={processing} className="px-8">
                            Save Profile
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

TutorProfileEdit.layout = {
    breadcrumbs: [{ title: 'My Profile', href: '/tutor/profile/edit' }],
};
