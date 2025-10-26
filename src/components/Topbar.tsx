import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Bell, Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const Topbar: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false);
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);

    const changeLang = (lang: string) => {
        i18n.changeLanguage(lang);
        setOpen(false);
    };

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    return (
        <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b shadow-sm">

            <div className="w-1/3"></div>

            <div className="w-1/3">
                <Input placeholder={t("topbar.search")} className="dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"/>
            </div>

            <div className="flex items-center space-x-4">

                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="relative">
                    <Bell size={18} className="text-gray-600 dark:text-gray-300 cursor-pointer" />
                    <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full" />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        <Globe className="w-4 h-4" />
                        <span>{i18n.language.toUpperCase()}</span>
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                            <button
                                onClick={() => changeLang("tr")}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                            >
                                🇹🇷 Türkçe
                            </button>
                            <button
                                onClick={() => changeLang("en")}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                            >
                                🇬🇧 English
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
