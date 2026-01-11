import React from "react";
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
  onOpenApiKeys,
  onLogout = () => {},
  className,
}) => {
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
          Pro Plan
        </Badge>
      </div>

      {/* 2. Menu Actions */}
      <div className="flex flex-col gap-1 px-1">
        {/* Manage API Keys */}
        <Button
          variant="ghost"
          className="w-full justify-start h-9 px-3 gap-3 !bg-transparent text-slate-300 hover:text-white hover:!bg-white/5 transition-all rounded-lg"
          onClick={onOpenApiKeys}
        >
          <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
            <Globe size={14} />
          </div>
          <span className="text-xs font-medium">Manage API Keys</span>
        </Button>

        {/* Global Settings */}
        <Button
          variant="ghost"
          className="w-full justify-start h-9 px-3 gap-3 !bg-transparent text-slate-300 hover:text-white hover:!bg-white/5 transition-all rounded-lg"
          onClick={onOpenSettings}
        >
          <div className="p-1 rounded bg-blue-500/10 text-blue-400">
            <Settings size={14} />
          </div>
          <span className="text-xs font-medium">Global Settings</span>
        </Button>
      </div>

      <Separator className="bg-white/5 my-2" />

      <div className="px-1 pb-1">
        {/* Logout - Subtle Red on Hover */}
        <Button
          variant="ghost"
          className="w-full justify-start h-9 px-3 gap-3 !bg-transparent text-slate-400 hover:!bg-rose-500/10 hover:text-rose-400 transition-all rounded-lg group"
          onClick={onLogout}
        >
          <LogOut
            size={16}
            className="group-hover:stroke-rose-400 transition-colors"
          />
          <span className="text-xs font-medium">Log Out</span>
        </Button>
      </div>

      <div className="mt-1 pb-1 px-3 flex items-center justify-between opacity-20 hover:opacity-100 transition-opacity duration-500">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
          HalTest Core
        </span>
        <img
          src="/images/haltest_logo.jpeg"
          className="w-4 h-4 rounded-sm"
          alt="logo"
        />
      </div>
    </div>
  );
};

export default UserConfigMenu;
