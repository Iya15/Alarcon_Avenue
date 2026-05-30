export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    phone?: string;
    avatar_path?: string;
    is_active: boolean;
    social_provider?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
        roles: string[];
    };
    flash: {
        success?: string;
        error?: string;
    };
    cart_count: number;
};
