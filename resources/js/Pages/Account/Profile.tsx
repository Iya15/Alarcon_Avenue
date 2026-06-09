import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Input from '@/Components/ui/Input';
import AccountLayout from '@/Components/account/AccountLayout';
import { useToast } from '@/stores/toastStore';
import type { PageProps } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

interface User {
    name: string; email: string; phone: string | null;
    avatar_url: string | null; email_verified: boolean; is_social_auth: boolean;
}
interface Props extends PageProps { user: User }

export default function AccountProfile({ user }: Props) {
    const toast = useToast();
    const avatarRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const profileForm = useForm({
        name: user.name, email: user.email, phone: user.phone ?? '', avatar: null as File | null,
    });

    const passwordForm = useForm({
        current_password: '', password: '', password_confirmation: '',
    });

    function submitProfile(e: React.FormEvent) {
        e.preventDefault();
        profileForm.post(route('account.profile.update'), {
            forceFormData: true,
            onSuccess: () => {
                // Revoke the local blob URL and let the server-returned avatar_url take over
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
                profileForm.setData('avatar', null);
                toast.success('Profile saved.');
            },
            onError: () => toast.error('Could not save profile. Check the fields below.'),
        });
    }

    function submitPassword(e: React.FormEvent) {
        e.preventDefault();
        passwordForm.post(route('account.password.update'), {
            onSuccess: () => {
                passwordForm.reset();
                toast.success('Password changed.');
            },
            onError: () => toast.error('Could not change password.'),
        });
    }

    const avatarSrc = previewUrl ?? user.avatar_url;

    return (
        <AccountLayout title="Profile">
            <Head title="My Profile" />

            {/* ── Profile info ───────────────────────────────────────────── */}
            <Card bordered className="mb-6 space-y-5">
                <h2 className="text-sm font-semibold text-ink-900">Personal information</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-ink-100 shrink-0">
                        {avatarSrc
                            ? <img src={avatarSrc} alt={user.name} className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-ink-400">{user.name.charAt(0).toUpperCase()}</div>
                        }
                    </div>
                    <div>
                        <Button variant="secondary" size="sm" onClick={() => avatarRef.current?.click()}>
                            Change photo
                        </Button>
                        <input
                            ref={avatarRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                profileForm.setData('avatar', file);
                                if (previewUrl) URL.revokeObjectURL(previewUrl);
                                setPreviewUrl(file ? URL.createObjectURL(file) : null);
                            }}
                        />
                        {profileForm.data.avatar && (
                            <p className="mt-1 text-xs text-ink-400">{profileForm.data.avatar.name}</p>
                        )}
                        {profileForm.errors.avatar && (
                            <p className="mt-1 text-xs text-danger-500">{profileForm.errors.avatar}</p>
                        )}
                    </div>
                </div>

                <form onSubmit={submitProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Full name" value={profileForm.data.name}
                        onChange={(e) => profileForm.setData('name', e.target.value)}
                        error={profileForm.errors.name} required />
                    <div>
                        <Input label="Email" type="email" value={profileForm.data.email}
                            onChange={(e) => profileForm.setData('email', e.target.value)}
                            error={profileForm.errors.email} required />
                        {!user.email_verified && (
                            <p className="mt-1 text-xs text-warning-600">Email not verified.</p>
                        )}
                    </div>
                    <Input label="Phone (optional)" value={profileForm.data.phone}
                        onChange={(e) => profileForm.setData('phone', e.target.value)}
                        error={profileForm.errors.phone} />
                    <div className="sm:col-span-2 flex justify-end">
                        <Button type="submit" loading={profileForm.processing}>Save profile</Button>
                    </div>
                </form>
            </Card>

            {/* ── Password ───────────────────────────────────────────────── */}
            {!user.is_social_auth && (
                <Card bordered className="space-y-4">
                    <h2 className="text-sm font-semibold text-ink-900">Change password</h2>
                    <form onSubmit={submitPassword} className="grid grid-cols-1 gap-4">
                        <Input label="Current password" type="password"
                            value={passwordForm.data.current_password}
                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                            error={passwordForm.errors.current_password} required />
                        <Input label="New password" type="password"
                            value={passwordForm.data.password}
                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                            error={passwordForm.errors.password} required />
                        <Input label="Confirm new password" type="password"
                            value={passwordForm.data.password_confirmation}
                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                            error={passwordForm.errors.password_confirmation} required />
                        <div className="flex justify-end">
                            <Button type="submit" loading={passwordForm.processing}>Update password</Button>
                        </div>
                    </form>
                </Card>
            )}
        </AccountLayout>
    );
}
