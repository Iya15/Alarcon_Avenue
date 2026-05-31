import PageLayout from '@/Components/layout/PageLayout';
import Container from '@/Components/layout/Container';
import { Head, Link } from '@inertiajs/react';
import type { PageProps } from '@/types';

export default function VendorDashboard({ auth }: PageProps) {
    return (
        <PageLayout>
            <Head title="Vendor Dashboard" />
            <Container className="py-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-ink-900">Vendor Dashboard</h1>
                    <p className="mt-1 text-sm text-ink-500">
                        Welcome, {auth.user?.name}. Manage your products below.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Link
                        href={route('admin.products.index')}
                        className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-6 transition hover:border-brand hover:shadow-sm"
                    >
                        <span className="text-2xl">📦</span>
                        <span className="font-semibold text-ink-900">My Products</span>
                        <span className="text-xs text-ink-500">Add, edit, and manage your listings</span>
                    </Link>

                    <Link
                        href={route('admin.orders.index')}
                        className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-6 transition hover:border-brand hover:shadow-sm"
                    >
                        <span className="text-2xl">🧾</span>
                        <span className="font-semibold text-ink-900">Orders</span>
                        <span className="text-xs text-ink-500">View orders containing your products</span>
                    </Link>

                    <Link
                        href={route('admin.inventory.index')}
                        className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-6 transition hover:border-brand hover:shadow-sm"
                    >
                        <span className="text-2xl">📊</span>
                        <span className="font-semibold text-ink-900">Inventory</span>
                        <span className="text-xs text-ink-500">Monitor stock levels</span>
                    </Link>
                </div>
            </Container>
        </PageLayout>
    );
}
