"use client"

import { usePathname } from "next/navigation"
import { Bell, LogOut, Settings, User, Search, Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useLanguage } from "@/components/providers/language-provider"

const pageNames: Record<string, string> = {
  "/dashboard": "dashboard.title",
  "/dashboard/users": "users.title",
  "/dashboard/transactions": "transactions.title",
  "/dashboard/country": "country.title",
  "/dashboard/network": "network.title",
  "/dashboard/devices": "devices.title",
  "/dashboard/sms-logs": "smsLogs.title",
  "/dashboard/fcm-logs": "fcmLogs.title",
  "/dashboard/partner": "partners.title",
  "/dashboard/topup": "topup.title",
  "/dashboard/earning-management": "earning.title",
  "/dashboard/wave-business-transaction": "Wave Business Transaction",
  "/dashboard/momo-pay": "MoMo Pay",
}

export function Header() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const pageTitle = pageNames[pathname] || "dashboard.title"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container-minimal flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">BP</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-foreground tracking-tight truncate">
                {t(pageTitle)}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 h-10 touch-manipulation">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src="/placeholder-user.jpg" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left min-w-0">
                  {/* <p className="text-sm font-medium">John Doe</p> */}
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="flex items-center gap-3 p-4 border-b border-border/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder-user.jpg" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">john@example.com</p>
                </div>
              </div>
              <div className="p-2">
                <DropdownMenuItem className="rounded-lg">
                  <User className="mr-3 h-4 w-4" />
                  <a href="/dashboard/profile">Profile</a>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg">
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg text-red-600 focus:text-red-600">
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}