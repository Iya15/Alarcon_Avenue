import Button from '@/Components/ui/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout title="Verify your email" subtitle="Check your inbox for the verification link we just sent.">
            <Head title="Email Verification" />

            <p className="text-sm text-ink-500">
                Thanks for signing up! Before getting started, please verify your
                email address by clicking the link we emailed to you. If you didn't
                receive it, we'll send another.
            </p>

            {status === 'verification-link-sent' && (
                <div className="mt-4 rounded-lg border border-success-100 bg-success-50 px-4 py-2.5 text-sm text-success-600">
                    A new verification link has been sent to your email.
                </div>
            )}

            <form onSubmit={submit} className="mt-5">
                <Button type="submit" loading={processing} className="w-full justify-center">
                    Resend verification email
                </Button>
            </form>

            <p className="mt-4 text-center text-sm text-ink-500">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="font-medium text-ink-500 hover:text-ink-900 underline underline-offset-2"
                >
                    Log out
                </Link>
            </p>
        </GuestLayout>
    );
}
