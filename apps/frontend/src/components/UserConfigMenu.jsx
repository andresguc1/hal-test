import React, { useState } from 'react';
import {
    User,
    Activity,
    RefreshCw,
    Globe,
    Settings,
    LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import SettingsPage from "./SettingsPage";

/**
 * UserConfigMenu Component
 * A professional, reusable menu for user settings and system status.
 * Now supports internal view switching to provide a more integrated UX.
 */
const UserConfigMenu = ({
    user = { name: "User Name", email: "hal-user@example.com" },
    apiStatus = "Online",
    lastChecked = "--:--",
    onRefresh = () => { },
    onLogout = () => { },
    currentLanguage = "en",
    onLanguageChange = () => { },
    languages = [
        { label: "English", value: "en" },
        { label: "Español", value: "es" },
    ],
    className
}) => {
    const [view, setView] = useState("main"); // "main" | "settings"

    if (view === "settings") {
        return (
            <div className={cn("flex flex-col w-[320px] min-h-[520px] bg-[#1e1e1e] text-[#FFFFFF] rounded-lg border border-[#333] shadow-2xl overflow-hidden", className)}>
                <SettingsPage onBack={() => setView("main")} />
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col w-[320px] p-4 bg-[#1e1e1e] text-[#FFFFFF] rounded-lg border border-[#333] shadow-2xl", className)}>

            {/* 1. Header (User Profile) */}
            <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-10 w-10 border border-[#333]">
                    <AvatarImage src={user.profilePic} alt={user.name} />
                    <AvatarFallback className="bg-[#ff9f1c] text-[#0b0c10] font-bold">
                        <User size={20} />
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium leading-none text-[#FFFFFF] truncate">{user.name}</span>
                    <span className="text-[11px] text-[#B0B0B0] mt-1 font-mono truncate">{user.email}</span>
                </div>
            </div>

            <Separator className="bg-[#333] mb-4" />

            {/* 2. System Status Section */}
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-[#B0B0B0] tracking-wide">
                        System Status
                    </span>
                    <Badge
                        variant="outline"
                        className={cn(
                            "px-2.5 py-0 h-5 text-[10px] font-bold uppercase tracking-wider border transition-all",
                            apiStatus === "Online"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}
                    >
                        <span className={cn(
                            "mr-1.5 h-1.5 w-1.5 rounded-full",
                            apiStatus === "Online" ? "bg-green-500" : "bg-red-500",
                            apiStatus === "Checking" && "animate-pulse"
                        )} />
                        {apiStatus}
                    </Badge>
                </div>

                <div className="flex items-center justify-between bg-[#252526] rounded-md border border-[#333] p-3">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-[#B0B0B0]">
                            Last check
                        </span>
                        <span className="text-[12px] text-[#FFFFFF] font-mono leading-none">
                            {lastChecked}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 !bg-transparent text-[#B0B0B0] hover:text-[#FFFFFF] hover:!bg-[#2A2A2A] transition-colors rounded-md border border-transparent hover:border-[#444]"
                        onClick={onRefresh}
                        title="Refresh Status"
                    >
                        <RefreshCw size={14} className={cn(apiStatus === "Checking" && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <Separator className="bg-[#333] mb-4" />

            {/* 3. Language Selector */}
            <div className="px-1 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm font-medium text-[#FFFFFF]/90">
                        <Globe size={16} className="text-[#B0B0B0]" />
                        <span>Language</span>
                    </div>
                    <Select value={currentLanguage} onValueChange={onLanguageChange}>
                        <SelectTrigger className="h-8 w-28 text-xs font-medium bg-[#252526] border-[#333] hover:bg-[#2A2A2A] text-[#FFFFFF] focus:ring-1 focus:ring-offset-0 ring-[#444]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e1e1e] border-[#333] text-[#FFFFFF]">
                            {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value} className="text-xs focus:bg-[#2A2A2A] focus:text-[#FFFFFF] cursor-pointer">
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator className="bg-[#333] mb-4" />

            {/* 4. Menu Actions */}
            <div className="flex flex-col gap-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3 gap-3 !bg-transparent text-[#B0B0B0] hover:!bg-[#2A2A2A] hover:text-[#FFFFFF] transition-all rounded-md group"
                    onClick={() => setView("settings")}
                >
                    <Settings size={18} className="text-[#B0B0B0] group-hover:text-[#FFFFFF] transition-colors" />
                    <span className="text-sm font-medium">Settings</span>
                </Button>

                <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3 gap-3 !bg-transparent text-red-500 hover:!bg-red-500/10 hover:text-red-400 transition-all rounded-md"
                    onClick={onLogout}
                >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                </Button>
            </div>
        </div>
    );
};

export default UserConfigMenu;
