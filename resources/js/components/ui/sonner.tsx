import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="bottom-right"
            richColors
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    '--success-bg': '#16a34a',
                    '--success-text': '#ffffff',
                    '--success-border': '#15803d',
                    '--error-bg': '#dc2626',
                    '--error-text': '#ffffff',
                    '--error-border': '#b91c1c',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
