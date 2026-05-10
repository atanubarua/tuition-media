import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    const [role, setRole] = useState<'guardian' | 'tutor'>('guardian');

    return (
        <>
            <Head title="Register" />
            <Form
                {...store()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid grid-cols-2 rounded-lg border p-1 text-sm font-medium">
                                <button
                                    type="button"
                                    onClick={() => setRole('guardian')}
                                    className={`rounded-md px-3 py-1.5 transition-colors ${role === 'guardian' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Guardian
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('tutor')}
                                    className={`rounded-md px-3 py-1.5 transition-colors ${role === 'tutor' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Tutor
                                </button>
                            </div>

                            <input type="hidden" name="role" value={role} />

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    required
                                    tabIndex={3}
                                    autoComplete="tel"
                                    name="phone"
                                    placeholder="+8801XXXXXXXXX"
                                />
                                <InputError message={errors.phone} />
                            </div>

                            {role === 'tutor' && (
                                <div className="grid gap-2">
                                    <Label>Gender</Label>
                                    <div className="grid grid-cols-2 rounded-lg border p-1 text-sm font-medium">
                                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1.5 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="male"
                                                className="sr-only"
                                                required={role === 'tutor'}
                                            />
                                            Male
                                        </label>
                                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1.5 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="female"
                                                className="sr-only"
                                                required={role === 'tutor'}
                                            />
                                            Female
                                        </label>
                                    </div>
                                    <InputError message={errors.gender} />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={6}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={7}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to register',
};
