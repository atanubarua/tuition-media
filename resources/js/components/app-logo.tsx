import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon className="size-8 shrink-0 rounded-md" />
            <div className="ml-2 grid flex-1 text-left leading-none">
                <span className="truncate text-sm font-extrabold tracking-tight text-sidebar-foreground">
                    Faruqe Sir
                </span>
                <span className="truncate text-[0.7rem] font-bold uppercase tracking-[0.18em] text-amber-500">
                    Tuition Media
                </span>
            </div>
        </>
    );
}
