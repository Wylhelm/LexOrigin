import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Sun, Moon, Eye, Users, Check, X } from 'lucide-react';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

interface ThemeOption {
    id: ThemeMode;
    name: string;
    description: string;
    icon: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
    {
        id: 'dark',
        name: 'Dark Mode',
        description: 'Default dark theme, easier on the eyes',
        icon: <Moon className="w-5 h-5" />,
    },
    {
        id: 'light',
        name: 'Light Mode',
        description: 'Standard light theme with clear contrast',
        icon: <Sun className="w-5 h-5" />,
    },
    {
        id: 'high-contrast',
        name: 'High Contrast',
        description: 'Maximum contrast for visibility',
        icon: <Eye className="w-5 h-5" />,
    },
    {
        id: 'senior',
        name: 'Senior Mode',
        description: 'Larger text, simplified interface',
        icon: <Users className="w-5 h-5" />,
    },
];

const AccessibilityMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeChange = (newTheme: ThemeMode) => {
        setTheme(newTheme);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2 rounded-lg transition-all flex items-center gap-2",
                    "hover:bg-opacity-80",
                    "theme-bg-secondary theme-text-primary",
                    isOpen && "ring-2 ring-indigo-500"
                )}
                aria-label="Accessibility settings"
                title="Accessibility settings"
            >
                <Settings className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                            "absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden",
                            "theme-bg-primary theme-border border"
                        )}
                    >
                        {/* Header */}
                        <div className="p-4 border-b theme-border">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold theme-text-primary text-lg">
                                    Accessibility
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
                                >
                                    <X className="w-4 h-4 theme-text-secondary" />
                                </button>
                            </div>
                            <p className="text-sm theme-text-secondary mt-1">
                                Choose a display mode
                            </p>
                        </div>

                        {/* Theme Options */}
                        <div className="p-2">
                            {themeOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleThemeChange(option.id)}
                                    className={cn(
                                        "w-full p-3 rounded-lg flex items-start gap-3 transition-all text-left mb-1 last:mb-0",
                                        theme === option.id
                                            ? "theme-bg-accent theme-text-accent"
                                            : "hover:theme-bg-secondary theme-text-primary"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                        theme === option.id
                                            ? "bg-indigo-600 text-white"
                                            : "theme-bg-tertiary theme-text-secondary"
                                    )}>
                                        {option.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{option.name}</span>
                                            {theme === option.id && (
                                                <Check className="w-4 h-4 text-indigo-500" />
                                            )}
                                        </div>
                                        <p className="text-sm theme-text-secondary mt-0.5">
                                            {option.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t theme-border bg-opacity-50 theme-bg-secondary">
                            <p className="text-xs theme-text-secondary text-center">
                                Settings are saved automatically
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccessibilityMenu;

