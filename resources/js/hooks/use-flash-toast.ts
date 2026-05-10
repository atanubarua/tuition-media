import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

const shownFlashToastKeys = new Set<string>();

export function useFlashToast(): void {
    const { flash } = usePage<{ flash: { toast?: FlashToast } }>().props;

    useEffect(() => {
        if (flash?.toast) {
            const toastKey = flash.toast.id ?? `${flash.toast.type}:${flash.toast.message}`;

            if (shownFlashToastKeys.has(toastKey)) {
                return;
            }

            shownFlashToastKeys.add(toastKey);
            toast[flash.toast.type](flash.toast.message);
        }
    }, [flash]);
}
