import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout title="Welcome back" subtitle="Sign in to your account">
            <Head title="Log in" />

            {status && (
                <div className="mb-4 rounded-lg border border-success-100 bg-success-50 px-4 py-2.5 text-sm text-success-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Email"
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    autoComplete="username"
                    autoFocus
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    required
                />

                <Input
                    label="Password"
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    autoComplete="current-password"
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    required
                />

                <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked as false)}
                            className="h-4 w-4 rounded border-ink-300 accent-brand"
                        />
                        Remember me
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <Button type="submit" loading={processing} className="w-full justify-center">
                    Log in
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-500">
                Don't have an account?{' '}
                <Link href={route('register')} className="font-medium text-brand-600 hover:text-brand-700">
                    Create one
                </Link>
            </p>
        </GuestLayout>
    );
}
