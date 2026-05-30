import { Head } from '@inertiajs/react';

interface Props {
    title: string;
    description?: string | null;
    image?: string | null;
    type?: 'website' | 'product' | 'article';
    canonicalUrl?: string;
    /** Raw JSON-LD object(s) to inject as application/ld+json scripts */
    jsonLd?: object | object[];
}

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Alarcon Avenue';

export default function SeoHead({ title, description, image, type = 'website', canonicalUrl, jsonLd }: Props) {
    const fullTitle = `${title} — ${APP_NAME}`;
    const safeDesc  = description ?? `Shop ${APP_NAME} — curated collections, unbeatable prices.`;
    const safeImage = image ?? '/og-default.png';
    const schemaList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

    return (
        <Head>
            <title>{fullTitle}</title>

            {/* Standard */}
            <meta name="description" content={safeDesc} />
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={safeDesc} />
            <meta property="og:image" content={safeImage} />
            <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
            <meta property="og:site_name" content={APP_NAME} />

            {/* Twitter Card */}
            <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={safeDesc} />
            {image && <meta name="twitter:image" content={image} />}

            {/* JSON-LD structured data */}
            {schemaList.map((schema, i) => (
                <script key={i} type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            ))}
        </Head>
    );
}
