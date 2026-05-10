import { useState, useRef, useEffect, useCallback } from 'react';

interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    fetchUrl: (q: string) => string;
    mapLabel: (item: any) => string;
    mapValue: (item: any) => string;
    placeholder?: string;
    className?: string;
    icon?: React.ReactNode;
}

export default function AutocompleteInput({
    value,
    onChange,
    fetchUrl,
    mapLabel,
    mapValue,
    placeholder,
    className = '',
    icon,
}: AutocompleteInputProps) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [show, setShow] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShow(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.length < 2) { setSuggestions([]); setShow(false); return; }
        const res = await fetch(fetchUrl(q));
        const data = await res.json();
        setSuggestions(data);
        setShow(data.length > 0);
        setActiveIndex(-1);
    }, [fetchUrl]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        fetchSuggestions(e.target.value);
    };

    const select = (item: any) => {
        onChange(mapValue(item));
        setShow(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!show) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            select(suggestions[activeIndex]);
        } else if (e.key === 'Escape') {
            setShow(false);
            setActiveIndex(-1);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {icon && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {icon}
                </span>
            )}
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onFocus={() => suggestions.length > 0 && setShow(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
            />
            {show && (
                <ul className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    {suggestions.map((item, i) => (
                        <li
                            key={i}
                            onMouseDown={() => select(item)}
                            className={`cursor-pointer px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 ${i === activeIndex ? 'bg-blue-50 text-blue-700' : ''}`}
                        >
                            {mapLabel(item)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
