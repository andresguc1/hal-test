import React from "react";
import logo from "@/assets/images/haltest_logo.jpeg";
import {
  User,
  Activity,
  RefreshCw,
  Globe,
  Settings,
  LogOut,
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
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import SettingsPage from "./SettingsPage";

/**
 * UserConfigMenu Component
 * A professional, reusable menu for user settings and system status.
 * Now supports internal view switching to provide a more integrated UX.
 */
const UserConfigMenu = ({
  user = { name: "User Name", email: "hal-user@example.com" },
  onOpenSettings,
  onLogout = () => {},
  currentLanguage = "en",
  onLanguageChange = () => {},
  languages = [],
  className,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col w-[280px] p-2 bg-[#1e1e1e]/80 backdrop-blur-md text-[#FFFFFF] rounded-xl border border-[#333] shadow-2xl",
        className,
      )}
    >
      {/* 1. User Info Section */}
      <div className="flex flex-col items-center p-4 border-b border-white/5 mb-2">
        <Avatar className="h-16 w-16 mb-3 ring-2 ring-white/10 shadow-lg">
          <AvatarImage src={user.profilePic} alt={user.name} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-base font-semibold text-white tracking-tight">
          {user.name}
        </span>
        <span className="text-xs text-slate-400 font-mono mt-0.5">
          {user.email}
        </span>

        <Badge
          variant="outline"
          className="mt-2 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
        >
          {t("app.pro_plan", "Pro Plan")}
        </Badge>
      </div>

      {/* 2. Menu Actions */}
      <div className="flex flex-col gap-1 px-1">
        {/* Unified Settings Hub */}
        <Button
          variant="ghost"
          className="w-full justify-start h-9 px-3 gap-3 !bg-transparent text-slate-300 hover:text-white hover:!bg-white/5 ui-transition-colors rounded-lg"
          onClick={() => onOpenSettings("general")}
        >
          <div className="p-1 rounded bg-blue-500/10 text-blue-400">
            <Settings size={14} />
          </div>
          <span className="text-xs font-medium">
            {t("app.settings", "Settings")}
          </span>
        </Button>

        {/* Language Selector */}
        {languages.length > 0 && (
          <div className="flex items-center justify-between h-9 px-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded bg-purple-500/10 text-purple-400">
                <Globe size={14} />
              </div>
              <span className="text-xs font-medium text-slate-300">
                {t("app.language", "Language")}
              </span>
            </div>
            <Select value={currentLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-[100px] h-7 text-xs bg-white/5 border-white/10 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                {languages.map((lang) => (
                  <SelectItem
                    key={lang.value}
                    value={lang.value}
                    className="text-xs hover:bg-slate-800 focus:bg-slate-800"
                  >
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator className="bg-white/5 my-2" />

      <div className="px-1 pb-1">
        {/* Logout - Subtle Red on Hover */}
        <Button
          variant="ghost"
          className="w-full justify-start h-9 px-3 gap-3 !bg-transparent text-slate-400 hover:!bg-rose-500/10 hover:text-rose-400 ui-transition-colors rounded-lg group"
          onClick={onLogout}
        >
          <LogOut
            size={16}
            className="group-hover:stroke-rose-400 transition-colors"
          />
          <span className="text-xs font-medium">
            {t("app.logout", "Log Out")}
          </span>
        </Button>
      </div>

      <div className="mt-1 pb-1 px-3 flex items-center justify-between opacity-20 hover:opacity-100 transition-opacity duration-500">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
          HalTest Core
        </span>
        <img src={logo} className="w-4 h-4 rounded-sm" alt="logo" />
      </div>
    </div>
  );
};

export default UserConfigMenu;
