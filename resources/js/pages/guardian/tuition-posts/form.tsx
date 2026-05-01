import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import ReactSelect from 'react-select';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Option = { id: number; name: string; type?: string; division_id?: number; district_id?: number; group_name?: string };

type Student = {
    student_name: string;
    academic_level: 'primary' | 'high_school' | 'college' | 'honors';
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

const CLASS_LEVELS: Record<Student['academic_level'], { value: string; label: string }[]> = {
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

    const { data, setData, post: submitPost, put, processing, errors } = useForm<PostShape>({
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
                academic_level: 'primary',
                class_level: 'nursery',
                honors_subject: '',
                medium: 'bangla',
                subject_ids: [],
            },
        ],
    });

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

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/guardian/tuition-posts/${post?.id}`);
            return;
        }
        submitPost('/guardian/tuition-posts');
    };

    const updateStudent = (index: number, patch: Partial<Student>) => {
        const next = [...data.students];
        next[index] = { ...next[index], ...patch };
        setData('students', next);
    };

    const handleAcademicLevelChange = (index: number, level: Student['academic_level']) => {
        const defaultClass = CLASS_LEVELS[level][0]?.value ?? '';
        updateStudent(index, { academic_level: level, class_level: defaultClass });
    };

    return (
        <>
            <Head title={isEdit ? 'Edit Tuition Job' : 'Post Tuition Job'} />
            <form onSubmit={submit} className="space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">{isEdit ? 'Edit Tuition Job' : 'Post Tuition Job'}</h1>
                </div>

                <div className="grid items-end gap-4 md:grid-cols-2">
                    <div>
                        <Label>Title</Label>
                        <Input className="mt-1" value={data.title ?? ''} onChange={(e) => setData('title', e.target.value)} />
                    </div>
                    <div>
                        <Label>Status</Label>
                        <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value as PostShape['status'])}
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
                    </div>
                    <div>
                        <Label>District <span className="text-destructive">*</span></Label>
                        <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                            value={data.district_id}
                            onChange={(e) => {
                                setData('district_id', Number(e.target.value));
                                setData('subdistrict_id', 0);
                            }}
                        >
                            <option value={0}>Select district</option>
                            {filteredDistricts.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>Area (Upazila/Thana) <span className="text-destructive">*</span></Label>
                        <ReactSelect
                            isSearchable
                            styles={SELECT_STYLES}
                            options={subdistrictOptions}
                            value={selectedSubdistrict}
                            onChange={(opt) => setData('subdistrict_id', opt?.value ?? 0)}
                            placeholder="Search area..."
                            className="mt-1"
                        />
                    </div>
                </div>

                {/* Salary */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <Label>Salary Type <span className="text-destructive">*</span></Label>
                        <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                            value={data.salary_type}
                            onChange={(e) => setData('salary_type', e.target.value as PostShape['salary_type'])}
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
                                    setData('salary_min', Math.max(0, Number(e.target.value)) || null);
                                    setData('salary_max', null);
                                }}
                            />
                            <InputError message={errors.salary_min} />
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
                                    onChange={(e) => setData('salary_min', Math.max(0, Number(e.target.value)) || null)}
                                />
                                <InputError message={errors.salary_min} />
                            </div>
                            <div>
                                <Label>Salary Max <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={data.salary_max ?? ''}
                                    onChange={(e) => setData('salary_max', Math.max(0, Number(e.target.value)) || null)}
                                />
                                <InputError message={errors.salary_max} />
                            </div>
                        </>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <Label>Days per week <span className="text-destructive">*</span></Label>
                        <ReactSelect
                            styles={SELECT_STYLES}
                            options={daysOptions}
                            value={daysOptions.find((o) => o.value === data.days_per_week) ?? null}
                            onChange={(opt) => opt && setData('days_per_week', opt.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label>Tutor gender preference</Label>
                        <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                            value={data.tutor_gender_preference}
                            onChange={(e) => setData('tutor_gender_preference', e.target.value as PostShape['tutor_gender_preference'])}
                        >
                            <option value="any">Any</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div>
                        <Label>Experience (months)</Label>
                        <Input type="number" value={data.required_experience_months ?? ''} onChange={(e) => setData('required_experience_months', Number(e.target.value) || null)} />
                    </div>
                </div>

                <div>
                    <Label>Preferred Time Slots</Label>
                    <ReactSelect
                        isMulti
                        styles={SELECT_STYLES}
                        options={timeSlotOptions}
                        value={timeSlotOptions.filter((o) => data.preferred_time_slots.includes(o.value))}
                        onChange={(selected) => setData('preferred_time_slots', selected.map((o) => o.value))}
                        placeholder="Select preferred time slots..."
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label>Preferred Universities</Label>
                    <ReactSelect
                        isMulti
                        isSearchable
                        styles={SELECT_STYLES}
                        options={universityOptions}
                        value={universityOptions.filter((o) => data.preferred_university_ids.includes(o.value))}
                        onChange={(selected) => setData('preferred_university_ids', selected.map((o) => o.value))}
                        placeholder="Search and select universities..."
                        className="mt-1"
                    />
                </div>

                {/* Students */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Student Requirements</h2>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setData('students', [
                                    ...data.students,
                                    {
                                        student_name: '',
                                        academic_level: 'primary',
                                        class_level: 'nursery',
                                        honors_subject: '',
                                        medium: 'bangla',
                                        subject_ids: [],
                                    },
                                ])
                            }
                        >
                            Add Student
                        </Button>
                    </div>

                    {data.students.map((student, index) => (
                        <div key={index} className="space-y-3 rounded-lg border p-4">
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <Label>Student Name <span className="text-destructive">*</span></Label>
                                    <Input value={student.student_name} onChange={(e) => updateStudent(index, { student_name: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Academic Level <span className="text-destructive">*</span></Label>
                                    <select
                                        className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                                        value={student.academic_level}
                                        onChange={(e) => handleAcademicLevelChange(index, e.target.value as Student['academic_level'])}
                                    >
                                        <option value="primary">Primary</option>
                                        <option value="high_school">High School</option>
                                        <option value="college">College</option>
                                        <option value="honors">Honors</option>
                                    </select>
                                </div>

                                {student.academic_level !== 'honors' && (
                                    <div>
                                        <Label>Class Level</Label>
                                        <select
                                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                                            value={student.class_level}
                                            onChange={(e) => updateStudent(index, { class_level: e.target.value })}
                                        >
                                            {CLASS_LEVELS[student.academic_level].map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

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
                                </div>
                            )}

                            <div>
                                <Label>Subjects to Teach <span className="text-destructive">*</span></Label>
                                <ReactSelect
                                    isMulti
                                    isSearchable
                                    styles={SELECT_STYLES}
                                    options={subjectOptions}
                                    value={subjectOptions.filter((o) => student.subject_ids.includes(o.value))}
                                    onChange={(selected) => updateStudent(index, { subject_ids: selected.map((o) => o.value) })}
                                    placeholder="Search and select subjects..."
                                    className="mt-1"
                                />
                            </div>

                            {data.students.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setData('students', data.students.filter((_, i) => i !== index))}
                                >
                                    Remove Student
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <InputError message={errors.students} />
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
