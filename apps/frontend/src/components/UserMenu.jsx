import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserConfigMenu from "./UserConfigMenu";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

import logo from "@/assets/images/haltest_logo.jpeg";

export default function UserMenu({
  onOpenSettings,
  onOpenApiKeys,
  apiUrl = "/api/status",
}) {
  const { i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [profilePic, setProfilePic] = useState(null);

  // API Status State
  const [apiStatus, setApiStatus] = useState({
    state: "Unknown", // "Online", "Offline", "Checking", "Unknown"
    lastChecked: null,
    message: "",
  });

  // Load profile pic
  useEffect(() => {
    const checkProfile = () => {
      const storedPic = localStorage.getItem("hal_user_avatar");
      // Aggressively ignore legacy logo paths (both relative and absolute)
      const isLegacyLogo =
        storedPic &&
        (storedPic.includes("haltest_logo.jpeg") ||
          storedPic === "/images/haltest_logo.jpeg");

      if (storedPic && !isLegacyLogo) {
        setProfilePic(storedPic);
      } else {
        setProfilePic(null); // Force fallback to imported `logo`
      }
    };
    checkProfile();
    window.addEventListener("storage", checkProfile);
    return () => window.removeEventListener("storage", checkProfile);
  }, [onOpenSettings]);

  // Check API Logic
  const checkApiStatus = async () => {
    try {
      // api.get prepends /api by default, so we remove it from the endpoint if it's already there
      const endpoint = apiUrl.startsWith("/api") ? apiUrl.substring(4) : apiUrl;
      await api.get(endpoint);

      setApiStatus({
        state: "Online",
        lastChecked: new Date(),
        message: "OK",
      });
    } catch (e) {
      if (e.name !== "AbortError") {
        setApiStatus({
          state: "Offline",
          lastChecked: new Date(),
          message: e.message || "Conn Error",
        });
      }
    }
  };

  // Initial check
  useEffect(() => {
    checkApiStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const handleLanguageChange = (val) => {
    i18n.changeLanguage(val);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-8 w-8 rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-white/10 hover:ring-gray-300 dark:hover:ring-white/20 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
          <Avatar className="h-full w-full">
            <AvatarImage
              src={profilePic || logo}
              alt="User"
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-medium">
              <User size={14} strokeWidth={2} />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      {/* ... rest of render ... */}

      <DropdownMenuContent
        className="p-0 border-none shadow-none bg-transparent"
        align="end"
        sideOffset={8}
      >
        <UserConfigMenu
          user={{
            name: user?.user_metadata?.full_name || "Investigator",
            email: user?.email || "No session",
            profilePic: profilePic,
          }}
          apiStatus={apiStatus.state}
          lastChecked={
            apiStatus.lastChecked
              ? apiStatus.lastChecked.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--:--"
          }
          onRefresh={checkApiStatus}
          onOpenSettings={onOpenSettings}
          onOpenApiKeys={onOpenApiKeys}
          onLogout={signOut}
          currentLanguage={i18n.language.split("-")[0]}
          onLanguageChange={handleLanguageChange}
          languages={[
            { label: "English", value: "en" },
            { label: "Español", value: "es" },
            { label: "Français", value: "fr" },
            { label: "Português", value: "pt" },
          ]}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
