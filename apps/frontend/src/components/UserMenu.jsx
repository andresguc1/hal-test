import React, { useState, useEffect, useRef } from "react";
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

export default function UserMenu({
  onOpenSettings,
  apiUrl = (import.meta.env.PROD
    ? "https://hal-test-backend.onrender.com"
    : "http://localhost:2001") + "/api/status",
}) {
  const { i18n } = useTranslation();
  const [profilePic, setProfilePic] = useState(null);

  // API Status State
  const [apiStatus, setApiStatus] = useState({
    state: "Unknown", // "Online", "Offline", "Checking", "Unknown"
    lastChecked: null,
    message: "",
  });

  const abortRef = useRef(null);

  // Load profile pic
  useEffect(() => {
    const checkProfile = () => {
      const storedPic = localStorage.getItem("hal_user_avatar");
      if (storedPic) setProfilePic(storedPic);
    };
    checkProfile();
    window.addEventListener("storage", checkProfile);
    return () => window.removeEventListener("storage", checkProfile);
  }, [onOpenSettings]);

  // Check API Logic
  const checkApiStatus = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setApiStatus((prev) => ({
      ...prev,
      state: "Checking",
      message: "Checking...",
    }));

    try {
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(apiUrl, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setApiStatus({
          state: "Online",
          lastChecked: new Date(),
          message: "OK",
        });
      } else {
        setApiStatus({
          state: "Offline",
          lastChecked: new Date(),
          message: `HTTP ${res.status}`,
        });
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setApiStatus({
          state: "Offline",
          lastChecked: new Date(),
          message: "Conn Error",
        });
      }
    }
  };

  // Initial check
  useEffect(() => {
    checkApiStatus();
  }, [apiUrl]);

  const handleLanguageChange = (val) => {
    i18n.changeLanguage(val);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full focus-visible:ring-1 focus-visible:ring-offset-0 ring-offset-background focus:outline-none"
        >
          <Avatar className="h-9 w-9 border border-border/50 hover:border-primary transition-colors">
            <AvatarImage src={profilePic} alt="User" className="object-cover" />
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User size={18} />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="p-0 border-none shadow-none bg-transparent"
        align="end"
        sideOffset={8}
      >
        <UserConfigMenu
          user={{
            name: "User Name", // Potentially fetch from context/storage
            email: "hal-user@example.com",
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
          onLogout={() => console.log("Logout triggered")}
          currentLanguage={i18n.language.split("-")[0]}
          onLanguageChange={handleLanguageChange}
          languages={[
            { label: "English", value: "en" },
            { label: "Español", value: "es" },
          ]}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
