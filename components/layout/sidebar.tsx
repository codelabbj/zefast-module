"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/providers/language-provider"
import { 
  BarChart3, Users, CreditCard, LogOut, Menu, X, 
  ChevronDown, ChevronUp, Globe, Share2, Phone, 
  Monitor, MessageCircle, Bell, Settings, User, 
  Home, DollarSign, Waves, Smartphone, Zap 
} from "lucide-react"
import { clearTokens } from "@/lib/api"

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()

  const toggleExpanded = (item: string) => {
    setExpandedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    )
  }

  const handleLogout = () => {
    clearTokens();
    if (typeof document !== 'undefined') {
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
    }
    localStorage.removeItem("isAuthenticated");
    router.push("/");
  }

  const navigationItems = [
    {
      name: t("nav.dashboard"),
      href: "/dashboard",
      icon: Home,
      current: pathname === "/dashboard",
    },
    {
      name: t("nav.users"),
      icon: Users,
      current: pathname.startsWith("/dashboard/users"),
      children: [
        { name: t("nav.register"), href: "/dashboard/users/register" },
        { name: t("nav.userList"), href: "/dashboard/users/list" },
      ],
    },
    {
      name: t("nav.transactions"),
      href: "/dashboard/transactions",
      icon: CreditCard,
      current: pathname === "/dashboard/transactions",
    },
    {
      name: t("nav.country"),
      icon: Globe,
      current: pathname.startsWith("/dashboard/country"),
      children: [
        { name: t("nav.countryList"), href: "/dashboard/country/list" },
        { name: t("nav.countryCreate"), href: "/dashboard/country/create" },
      ],
    },
    {
      name: t("nav.network"),
      icon: Share2,
      current: pathname.startsWith("/dashboard/network"),
      children: [
        { name: t("nav.networkList"), href: "/dashboard/network/list" },
        { name: t("nav.networkCreate"), href: "/dashboard/network/create" },
      ],
    },
    {
      name: t("nav.phoneNumbers"),
      href: "/dashboard/phone-number/list",
      icon: Phone,
      current: pathname === "/dashboard/phone-number/list",
    },
    {
      name: t("nav.devices"),
      icon: Monitor,
      current: pathname.startsWith("/dashboard/devices"),
      children: [
        { name: t("nav.devicesList"), href: "/dashboard/devices/list" },
      ],
    },
    {
      name: t("nav.smsLogs"),
      href: "/dashboard/sms-logs/list",
      icon: MessageCircle,
      current: pathname === "/dashboard/sms-logs/list",
    },
    {
      name: t("nav.fcmLogs"),
      href: "/dashboard/fcm-logs/list",
      icon: Bell,
      current: pathname === "/dashboard/fcm-logs/list",
    },
    // {
    //   name: t("nav.partner"),
    //   href: "/dashboard/partner",
    //   icon: User,
    //   current: pathname === "/dashboard/partner",
    // },
    {
      name: t("topup.title"),
      href: "/dashboard/topup",
      icon: DollarSign,
      current: pathname === "/dashboard/topup",
    },
    {
      name: t("earning.title"),
      href: "/dashboard/earning-management",
      icon: BarChart3,
      current: pathname === "/dashboard/earning-management",
    },
    {
      name: t("Wave Business Transaction"),
      href: "/dashboard/wave-business-transaction",
      icon: Waves,
      current: pathname === "/dashboard/wave-business-transaction",
    },
    {
      name: "MoMo Pay",
      href: "/dashboard/momo-pay",
      icon: Smartphone,
      current: pathname === "/dashboard/momo-pay",
    },
  ]

  const NavItem = ({ item }: { item: any }) => {
    const isExpanded = expandedItems.includes(item.name)
    const hasChildren = item.children && item.children.length > 0

    if (hasChildren) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.name)}
            className={cn(
              "minimal-nav-item w-full justify-between h-11 px-3 rounded-lg touch-manipulation",
              item.current && "minimal-nav-item-active"
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="truncate font-medium">{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0" />
            )}
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="pl-8 space-y-1">
              {item.children.map((child: any) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "minimal-nav-item text-sm h-10 px-3 rounded-lg touch-manipulation font-medium",
                    pathname === child.href && "minimal-nav-item-active"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="truncate">{child.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <Link
        href={item.href}
        className={cn(
          "minimal-nav-item h-11 px-3 rounded-lg touch-manipulation font-medium",
          item.current && "minimal-nav-item-active"
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className="h-5 w-5" />
        <span className="truncate">{item.name}</span>
      </Link>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-[60] h-12 w-12 bg-background/95 backdrop-blur-xl shadow-elevated border border-border/50 hover:bg-background hover:shadow-minimal-lg transition-all duration-200 active:scale-95"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
        sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <div className={cn(
          "fixed inset-y-0 left-0 flex w-80 flex-col bg-background border-r border-border/50 shadow-elevated min-h-0 transform transition-transform duration-300 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BP</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-foreground truncate">Zefast Module</h1>
                <p className="text-xs text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 p-4 overflow-y-auto overscroll-contain">
            {navigationItems.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          <div className="p-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-11"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-medium">{t("nav.logout")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-background border-r border-border/50 shadow-elevated min-h-0">
          <div className="flex h-16 items-center px-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BP</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Zefast Module</h1>
                <p className="text-xs text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
            {navigationItems.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
          
          <div className="p-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              {t("nav.logout")}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}