import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout title="Reset your password" subtitle="We'll send a reset link to your email.">
            <Head title="Forgot Password" />

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
                    autoFocus
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    required
                />

                <Button type="submit" loading={processing} className="w-full justify-center">
                    Send reset link
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-500">
                Remember your password?{' '}
                <Link href={route('login')} className="font-medium text-brand-600 hover:text-brand-700">
                    Back to login
                </Link>
            </p>
        </GuestLayout>
    );
}
