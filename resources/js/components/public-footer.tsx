import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface PublicFooterLabels {
    name?: string;
    tuition?: string;
    media?: string;
    copyright?: string;
    terms?: string;
    privacy?: string;
    contact?: string;
}

function fill(template: string, vars: Record<string, string | number>) {
    return Object.entries(vars).reduce(
        (result, [key, value]) => result.replace(`:${key}`, String(value)),
        template,
    );
}

export default function PublicFooter({ labels = {} }: { labels?: PublicFooterLabels }) {
    const name = labels.name || 'Faruqe Sir';
    const tuition = labels.tuition || 'Tuition';
    const media = labels.media || 'Media';
    const copyright = fill(labels.copyright || '© :year Faruqe Sir Tuition Media. All rights reserved.', {
        year: new Date().getFullYear(),
    });

    return (
        <footer className="bg-slate-900 py-8 text-slate-400">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row">
                <div className="flex items-center gap-3 text-white">
                    <AppLogoIcon className="h-10 w-10 shrink-0 rounded-xl" />
                    <div className="flex flex-col leading-none">
                        <span className="text-lg font-extrabold tracking-tight text-white sm:text-xl">{name}</span>
                        <span className="text-[0.95rem] font-bold tracking-[0.08em] text-amber-500 sm:text-base">
                            {tuition} {media}
                        </span>
                    </div>
                </div>
                <p className="text-sm">{copyright}</p>
                <div className="flex gap-6 text-sm font-medium">
                    <Link href="#" className="transition hover:text-white">
                        {labels.terms || 'Terms'}
                    </Link>
                    <Link href="#" className="transition hover:text-white">
                        {labels.privacy || 'Privacy'}
                    </Link>
                    <Link href="#" className="transition hover:text-white">
                        {labels.contact || 'Contact'}
                    </Link>
                </div>
            </div>
        </footer>
    );
}
