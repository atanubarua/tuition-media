import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <>
            <Head title="Log in" />

            <Form
                {...store()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone number</Label>
                                <div className="flex rounded-md border border-input focus-within:ring-[3px] focus-within:ring-ring/50">
                                    <span className="flex items-center border-r border-input bg-muted px-3 text-sm text-muted-foreground">
                                        +88
                                    </span>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="tel-national"
                                        inputMode="numeric"
                                        pattern="01[0-9]{9}"
                                        minLength={11}
                                        placeholder="01812345678"
                                        className="border-0 shadow-none focus-visible:ring-0"
                                        onInput={(event) => {
                                            const digits = event.currentTarget.value.replace(/\D/g, '');
                                            const normalized = digits.startsWith('88') && digits.length > 11
                                                ? digits.slice(-11)
                                                : digits.startsWith('01')
                                                    ? digits.slice(0, 11)
                                                    : digits.startsWith('1')
                                                        ? `0${digits.slice(0, 10)}`
                                                        : digits.length > 11
                                                            ? digits.slice(-11)
                                                            : digits;

                                            event.currentTarget.value = normalized.slice(0, 11);
                                        }}
                                    />
                                </div>
                                <InputError message={errors.phone} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <TextLink href={register()} tabIndex={5}>
                                    Sign up
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your phone number and password below to log in',
};
