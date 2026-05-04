import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import ReactSelect from 'react-select';
import { z } from 'zod';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Option = { id: number; name: string; type?: string; division_id?: number; district_id?: number; group_name?: string };

type Student = {
    student_name: string;
    academic_level: '' | 'primary' | 'high_school' | 'college' | 'honors';
    class_level: string;
    honors_subject: string;
    medium: 'bangla' | 'english' | 'madrasha' | 'other';
    subject_ids: number[];
};

type PostShape = {
    id?: number;
    title: string | null;
    division_id: number;
    district_id: number;
    subdistrict_id: number;
    address_line: string | null;
    salary_type: 'fixed' | 'range';
    salary_min: number | null;
    salary_max: number | null;
    days_per_week: number;
    preferred_time_slots: string[];
    duration_months: number | null;
    tutor_gender_preference: 'male' | 'female' | 'any';
    required_experience_months: number | null;
    special_requirements: string | null;
    status: 'draft' | 'published';
    preferred_university_ids: number[];
    students: Array<Student & { subject_ids: number[] }>;
};

const CLASS_LEVELS: Record<Exclude<Student['academic_level'], ''>, { value: string; label: string }[]> = {
    primary: [
        { value: 'nursery', label: 'Nursery' },
        { value: 'kg', label: 'KG' },
        { value: '1', label: 'Class 1' },
        { value: '2', label: 'Class 2' },
        { value: '3', label: 'Class 3' },
        { value: '4', label: 'Class 4' },
        { value: '5', label: 'Class 5' },
    ],
    high_school: [
        { value: '6', label: 'Class 6' },
        { value: '7', label: 'Class 7' },
        { value: '8', label: 'Class 8' },
        { value: '9', label: 'Class 9' },
        { value: '10', label: 'Class 10' },
    ],
    college: [
        { value: '11', label: 'Class 11' },
        { value: '12', label: 'Class 12' },
    ],
    honors: [],
};

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

const studentSchema = z.object({
    student_name: z.string(),
    academic_level: z.enum(['primary', 'high_school', 'college', 'honors', '']),
    class_level: z.string(),
    honors_subject: z.string(),
    medium: z.enum(['bangla', 'english', 'madrasha', 'other']),
    subject_ids: z.array(z.number()),
});

const postClientSchema = z.object({
    division_id: z.number(),
    district_id: z.number(),
    subdistrict_id: z.number(),
    salary_type: z.enum(['fixed', 'range']),
    salary_min: z.number().nullable(),
    salary_max: z.number().nullable(),
    days_per_week: z.number(),
    required_experience_months: z.number().nullable(),
    preferred_university_ids: z.array(z.number()),
    students: z.array(studentSchema),
});

export default function TuitionPostForm({
    post,
    divisions,
    districts,
    subdistricts,
    universities,
    subjects,
}: {
    post?: PostShape;
    divisions: Option[];
    districts: Option[];
    subdistricts: Option[];
    universities: Option[];
    subjects: Option[];
}) {
    const isEdit = Boolean(post?.id);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const { data, setData, post: submitPost, put, processing, errors: rawErrors, clearErrors } = useForm<PostShape>({
        title: post?.title ?? '',
        division_id: post?.division_id ?? 0,
        district_id: post?.district_id ?? 0,
        subdistrict_id: post?.subdistrict_id ?? 0,
        address_line: post?.address_line ?? '',
        salary_type: (post?.salary_type === 'range' ? 'range' : 'fixed'),
        // fixed stores the amount in salary_min; salary_max is only used for range
        salary_min: post?.salary_min ?? null,
        salary_max: post?.salary_max ?? null,
        days_per_week: post?.days_per_week ?? 3,
        preferred_time_slots: post?.preferred_time_slots ?? [],
        duration_months: post?.duration_months ?? null,
        tutor_gender_preference: post?.tutor_gender_preference ?? 'any',
        required_experience_months: post?.required_experience_months ?? null,
        special_requirements: post?.special_requirements ?? '',
        status: post?.status ?? 'published',
        preferred_university_ids: post?.preferred_university_ids ?? [],
        students: post?.students ?? [
            {
                student_name: '',
                academic_level: '',
                class_level: '',
                honors_subject: '',
                medium: 'bangla',
                subject_ids: [],
            },
        ],
    });

    const errors = useMemo(
        () => ({ ...(rawErrors as Record<string, string>), ...clientErrors }),
        [rawErrors, clientErrors],
    );

    const filteredDistricts = districts.filter((d) => d.division_id === data.division_id);
    const filteredSubdistricts = subdistricts.filter((s) => s.district_id === data.district_id);
    const subdistrictOptions = filteredSubdistricts.map((s) => ({ value: s.id, label: s.type ? `${s.name} (${s.type})` : s.name }));
    const selectedSubdistrict = subdistrictOptions.find((o) => o.value === data.subdistrict_id) ?? null;

    const universityOptions = universities.map((u) => ({ value: u.id, label: u.name }));
    const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
    const daysOptions = Array.from({ length: 7 }, (_, i) => ({ value: i + 1, label: `${i + 1} day${i > 0 ? 's' : ''}` }));
    const timeSlotOptions = [
        '6am-7am', '7am-8am', '8am-9am', '9am-10am', '10am-11am', '11am-12pm',
        '12pm-1pm', '1pm-2pm', '2pm-3pm', '3pm-4pm', '4pm-5pm', '5pm-6pm',
        '6pm-7pm', '7pm-8pm', '8pm-9pm', '9pm-10pm',
    ].map((s) => ({ value: s, label: s }));

    const validateClient = (): Record<string, string> => {
        const nextErrors: Record<string, string> = {};
        const validDivisionIds = new Set(divisions.map((d) => d.id));
        const validDistrictIds = new Set(filteredDistricts.map((d) => d.id));
        const validSubdistrictIds = new Set(filteredSubdistricts.map((s) => s.id));
        const validUniversityIds = new Set(universities.map((u) => u.id));
        const validSubjectIds = new Set(subjects.map((s) => s.id));

        const result = postClientSchema.superRefine((payload, ctx) => {
            if (!payload.division_id || !validDivisionIds.has(payload.division_id)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['division_id'], message: 'Please select a valid division.' });
            }

            if (!payload.district_id || !validDistrictIds.has(payload.district_id)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['district_id'], message: 'Please select a valid district.' });
            }

            if (!payload.subdistrict_id || !validSubdistrictIds.has(payload.subdistrict_id)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['subdistrict_id'], message: 'Please select a valid area.' });
            }

            if (!payload.days_per_week || payload.days_per_week < 1 || payload.days_per_week > 7) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['days_per_week'], message: 'Days per week must be between 1 and 7.' });
            }

            if (payload.salary_type === 'fixed' && (payload.salary_min === null || payload.salary_min <= 0)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salary_min'], message: 'Salary amount is required.' });
            }

            if (payload.salary_type === 'range') {
                if (payload.salary_min === null || payload.salary_max === null || payload.salary_min <= 0 || payload.salary_max <= 0) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salary_min'], message: 'Salary range requires both minimum and maximum.' });
                    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salary_max'], message: 'Salary range requires both minimum and maximum.' });
                } else if (payload.salary_max < payload.salary_min) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salary_max'], message: 'Maximum salary must be greater than or equal to minimum salary.' });
                }
            }

            if (payload.required_experience_months !== null && (payload.required_experience_months < 0 || payload.required_experience_months > 600)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['required_experience_months'],
                    message: 'Experience must be between 0 and 600 months.',
                });
            }

            if (payload.students.length < 1) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['students'], message: 'Please add at least one student.' });
            }

            payload.students.forEach((student, index) => {
                if (!student.academic_level) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['students', index, 'academic_level'],
                        message: 'Please select an academic level for the student.',
                    });
                }

                if (student.academic_level !== 'honors' && !student.class_level.trim()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['students', index, 'class_level'],
                        message: 'Class level is required for this academic level.',
                    });
                }

                if (student.academic_level === 'honors' && !student.honors_subject.trim()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['students', index, 'honors_subject'],
                        message: 'Honors subject is required for honors level.',
                    });
                }

                if (!student.subject_ids?.length) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['students', index, 'subject_ids'],
                        message: 'Please select at least one subject for the student.',
                    });
                } else if (student.subject_ids.some((id) => !validSubjectIds.has(id))) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['students', index, 'subject_ids'],
                        message: 'One or more selected subjects are invalid.',
                    });
                }
            });

            if (payload.preferred_university_ids.some((id) => !validUniversityIds.has(id))) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['preferred_university_ids'],
                    message: 'One or more selected universities are invalid.',
                });
            }
        }).safeParse(data);

        if (!result.success) {
            result.error.issues.forEach((issue) => {
                const key = issue.path.join('.');
                if (!nextErrors[key]) {
                    nextErrors[key] = issue.message;
                }
            });
        }

        return nextErrors;
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const nextErrors = validateClient();
        setClientErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        if (isEdit) {
            put(`/guardian/tuition-posts/${post?.id}`);

            return;
        }

        submitPost('/guardian/tuition-posts');
    };

    const clearFieldErrors = (...keys: string[]) => {
        setClientErrors((prev) => {
            const next = { ...prev };

            keys.forEach((key) => {
                delete next[key];
            });

            return next;
        });
        clearErrors(...(keys as Parameters<typeof clearErrors>));
    };

    const updateStudent = (index: number, patch: Partial<Student>) => {
        const keys = Object.keys(patch).map((key) => `students.${index}.${key}`);
        clearFieldErrors(...keys);
        const next = [...data.students];
        next[index] = { ...next[index], ...patch };
        setData('students', next);
    };

    const handleAcademicLevelChange = (index: number, level: Student['academic_level']) => {
        updateStudent(index, { academic_level: level, class_level: '' });
    };

    const toggleTimeSlot = (slot: string, checked: boolean) => {
        clearFieldErrors('preferred_time_slots');

        if (checked) {
            setData('preferred_time_slots', Array.from(new Set([...data.preferred_time_slots, slot])));

            return;
        }

        setData('preferred_time_slots', data.preferred_time_slots.filter((s) => s !== slot));
    };

    return (
        <>
            <Head title={isEdit ? 'Edit Tuition Job' : 'Post Tuition Job'} />
            <form onSubmit={submit} className="space-y-6 p-4">
                <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="icon" asChild>
                        <Link href="/guardian/tuition-posts" aria-label="Back to My Tuition Posts">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-semibold">{isEdit ? 'Edit Tuition Job' : 'Post Tuition Job'}</h1>
                </div>

                <div className="grid items-end gap-4 md:grid-cols-2">
                    <div>
                        <Label>Title</Label>
                        <Input
                            className="mt-1"
                            value={data.title ?? ''}
                            onChange={(e) => {
                                clearFieldErrors('title');
                                setData('title', e.target.value);
                            }}
                        />
                        <InputError message={errors['title']} />
                    </div>
                    <div>
                        <Label>Status</Label>
                        <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                            value={data.status}
                            onChange={(e) => {
                                clearFieldErrors('status');
                                setData('status', e.target.value as PostShape['status']);
                            }}
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <Label>Division <span className="text-destructive">*</span></Label>
                        <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                            value={data.division_id}
                            onChange={(e) => {
                                clearFieldErrors('division_id', 'district_id', 'subdistrict_id');
                                setData('division_id', Number(e.target.value));
                                setData('district_id', 0);
                                setData('subdistrict_id', 0);
                            }}
                        >
                            <option value={0}>Select division</option>
                            {divisions.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-muted-foreground">Step 1: Select a division first.</p>
                        <InputError message={errors['division_id']} />
                    </div>
                    <div>
                        <Label>District <span className="text-destructive">*</span></Label>
                        <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 disabled:opacity-60"
                            value={data.district_id}
                            onChange={(e) => {
                                clearFieldErrors('district_id', 'subdistrict_id');
                                setData('district_id', Number(e.target.value));
                                setData('subdistrict_id', 0);
                            }}
                            disabled={!data.division_id}
                        >
                            <option value={0}>{data.division_id ? 'Select district' : 'Select division first'}</option>
                            {filteredDistricts.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-muted-foreground">Step 2: Select a district after choosing division.</p>
                        <InputError message={errors['district_id']} />
                    </div>
                    <div>
                        <Label>Area (Upazila/Thana) <span className="text-destructive">*</span></Label>
                        <ReactSelect
                            instanceId="subdistrict"
                            isSearchable
                            styles={SELECT_STYLES}
                            options={subdistrictOptions}
                            value={selectedSubdistrict}
                            onChange={(opt) => {
                                clearFieldErrors('subdistrict_id');
                                setData('subdistrict_id', opt?.value ?? 0);
                            }}
                            placeholder={
                                !data.division_id
                                    ? 'Select division first'
                                    : data.district_id
                                      ? 'Search area...'
                                      : 'Select district first'
                            }
                            isDisabled={!data.district_id}
                            className="mt-1"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Step 3: Select area (upazila/thana) after choosing district.</p>
                        <InputError message={errors['subdistrict_id']} />
                    </div>
                </div>

                {/* Salary */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <Label>Salary Type <span className="text-destructive">*</span></Label>
                        <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                            value={data.salary_type}
                            onChange={(e) => {
                                clearFieldErrors('salary_type', 'salary_min', 'salary_max');
                                setData('salary_type', e.target.value as PostShape['salary_type']);
                            }}
                        >
                            <option value="fixed">Fixed</option>
                            <option value="range">Range</option>
                        </select>
                    </div>

                    {data.salary_type === 'fixed' && (
                        <div>
                            <Label>Salary Amount <span className="text-destructive">*</span></Label>
                            <Input
                                type="number"
                                min={0}
                                value={data.salary_min ?? ''}
                                onChange={(e) => {
                                    clearFieldErrors('salary_min', 'salary_max');
                                    setData('salary_min', Math.max(0, Number(e.target.value)) || null);
                                    setData('salary_max', null);
                                }}
                            />
                            <InputError message={errors['salary_min']} />
                        </div>
                    )}

                    {data.salary_type === 'range' && (
                        <>
                            <div>
                                <Label>Salary Min <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={data.salary_min ?? ''}
                                    onChange={(e) => {
                                        clearFieldErrors('salary_min');
                                        setData('salary_min', Math.max(0, Number(e.target.value)) || null);
                                    }}
                                />
                                <InputError message={errors['salary_min']} />
                            </div>
                            <div>
                                <Label>Salary Max <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={data.salary_max ?? ''}
                                    onChange={(e) => {
                                        clearFieldErrors('salary_max');
                                        setData('salary_max', Math.max(0, Number(e.target.value)) || null);
                                    }}
                                />
                                <InputError message={errors['salary_max']} />
                            </div>
                        </>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <Label>Days per week <span className="text-destructive">*</span></Label>
                        <ReactSelect
                            instanceId="days-per-week"
                            styles={SELECT_STYLES}
                            options={daysOptions}
                            value={daysOptions.find((o) => o.value === data.days_per_week) ?? null}
                            onChange={(opt) => {
                                clearFieldErrors('days_per_week');

                                if (opt) {
                                    setData('days_per_week', opt.value);
                                }
                            }}
                            className="mt-1"
                        />
                        <InputError message={errors['days_per_week']} />
                    </div>
                    <div>
                        <Label>Tutor gender preference</Label>
                        <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                            value={data.tutor_gender_preference}
                            onChange={(e) => {
                                clearFieldErrors('tutor_gender_preference');
                                setData('tutor_gender_preference', e.target.value as PostShape['tutor_gender_preference']);
                            }}
                        >
                            <option value="any">Any</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div>
                        <Label>Experience (months)</Label>
                        <Input
                            type="number"
                            value={data.required_experience_months ?? ''}
                            onChange={(e) => {
                                clearFieldErrors('required_experience_months');
                                setData('required_experience_months', Number(e.target.value) || null);
                            }}
                        />
                        <InputError message={errors['required_experience_months']} />
                    </div>
                </div>

                <div>
                    <Label>Preferred Time Slots</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border p-3 md:grid-cols-4">
                        {timeSlotOptions.map((slot) => (
                            <label key={slot.value} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={data.preferred_time_slots.includes(slot.value)}
                                    onCheckedChange={(checked) => toggleTimeSlot(slot.value, checked === true)}
                                />
                                <span>{slot.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <Label>Preferred Universities</Label>
                    <ReactSelect
                        instanceId="preferred-universities"
                        isMulti
                        styles={SELECT_STYLES}
                        options={universityOptions}
                        value={universityOptions.filter((o) => data.preferred_university_ids.includes(o.value))}
                        onChange={(selected) => {
                            clearFieldErrors('preferred_university_ids');
                            setData('preferred_university_ids', selected.map((o) => o.value));
                        }}
                        placeholder="Search and select universities..."
                        noOptionsMessage={() => 'No universities found'}
                        className="mt-1"
                    />
                    <InputError message={errors['preferred_university_ids']} />
                </div>

                {/* Students */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Student Requirements</h2>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                clearFieldErrors('students');
                                setData('students', [
                                    ...data.students,
                                    {
                                        student_name: '',
                                        academic_level: '',
                                        class_level: '',
                                        honors_subject: '',
                                        medium: 'bangla',
                                        subject_ids: [],
                                    },
                                ]);
                            }}
                        >
                            Add Student
                        </Button>
                    </div>

                    {data.students.map((student, index) => (
                        <div key={index} className="space-y-3 rounded-lg border p-4">
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <Label>Student Name</Label>
                                    <Input className="mt-1" value={student.student_name} onChange={(e) => updateStudent(index, { student_name: e.target.value })} />
                                    <InputError message={errors[`students.${index}.student_name`]} />
                                </div>
                                <div>
                                    <Label>Academic Level <span className="text-destructive">*</span></Label>
                                    <select
                                        className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                                        value={student.academic_level}
                                        onChange={(e) => handleAcademicLevelChange(index, e.target.value as Student['academic_level'])}
                                    >
                                        <option value="">Select academic level</option>
                                        <option value="primary">Primary</option>
                                        <option value="high_school">High School</option>
                                        <option value="college">College</option>
                                        <option value="honors">Honors</option>
                                    </select>
                                    <InputError message={errors[`students.${index}.academic_level`]} />
                                </div>

                                <div>
                                    <Label>Class Level <span className="text-destructive">*</span></Label>
                                    <select
                                        className="mt-1 w-full rounded-md border bg-background px-3 py-2 disabled:opacity-60"
                                        value={student.class_level}
                                        onChange={(e) => updateStudent(index, { class_level: e.target.value })}
                                        disabled={student.academic_level === '' || student.academic_level === 'honors'}
                                    >
                                        <option value="">
                                            {student.academic_level === ''
                                                ? 'Select academic level first'
                                                : student.academic_level === 'honors'
                                                  ? 'Not required for honors'
                                                  : 'Select class level'}
                                        </option>
                                        {student.academic_level !== '' && student.academic_level !== 'honors' &&
                                            CLASS_LEVELS[student.academic_level].map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                    </select>
                                    <InputError message={errors[`students.${index}.class_level`]} />
                                </div>

                                <div>
                                    <Label>Medium <span className="text-destructive">*</span></Label>
                                    <select
                                        className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                                        value={student.medium}
                                        onChange={(e) => updateStudent(index, { medium: e.target.value as Student['medium'] })}
                                    >
                                        <option value="bangla">Bangla</option>
                                        <option value="english">English</option>
                                        <option value="madrasha">Madrasha</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {student.academic_level === 'honors' && (
                                <div>
                                    <Label>Honors Subject/Department</Label>
                                    <Input value={student.honors_subject ?? ''} onChange={(e) => updateStudent(index, { honors_subject: e.target.value })} />
                                    <InputError message={errors[`students.${index}.honors_subject`]} />
                                </div>
                            )}

                            <div>
                                <Label>Subjects to Teach <span className="text-destructive">*</span></Label>
                                <ReactSelect
                                    instanceId={`student-subjects-${index}`}
                                    isMulti
                                    styles={SELECT_STYLES}
                                    options={subjectOptions}
                                    value={subjectOptions.filter((o) => student.subject_ids.includes(o.value))}
                                    onChange={(selected) => updateStudent(index, { subject_ids: selected.map((o) => o.value) })}
                                    placeholder="Search and select subjects..."
                                    className="mt-1"
                                />
                                <InputError message={errors[`students.${index}.subject_ids`]} />
                            </div>

                            {data.students.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => {
                                        clearFieldErrors('students');
                                        setData('students', data.students.filter((_, i) => i !== index));
                                    }}
                                >
                                    Remove Student
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <InputError message={errors['students']} />
                <Button type="submit" disabled={processing}>{isEdit ? 'Update Post' : 'Create Post'}</Button>
            </form>
        </>
    );
}

TuitionPostForm.layout = {
    breadcrumbs: [
        {
            title: 'My Tuition Posts',
            href: '/guardian/tuition-posts',
        },
    ],
};
