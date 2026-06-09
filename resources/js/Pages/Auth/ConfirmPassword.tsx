import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout title="Confirm your password" subtitle="This is a secure area. Please re-enter your password to continue.">
            <Head title="Confirm Password" />

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Password"
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    autoComplete="current-password"
                    autoFocus
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    required
                />

                <Button type="submit" loading={processing} className="w-full justify-center">
                    Confirm
                </Button>
            </form>
        </GuestLayout>
    );
}
