import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Activity, Bird, Building2, ChevronLeft, CircleDollarSign, ClipboardPlus, Drumstick, FileBarChart2, HandCoins, HeartPulse, LayoutDashboard, LogOut, Scale, ShieldCheck, Warehouse, WalletCards } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "لوحة المتابعة", path: "/" },
  { icon: Building2, label: "المزارع", path: "/farms" },
  { icon: Bird, label: "العنابر والأقفاص", path: "/housing" },
  { icon: Warehouse, label: "مخزون العلف", path: "/feed-stock" },
  { icon: CircleDollarSign, label: "المصاريف", path: "/expenses" },
  { icon: WalletCards, label: "حسابات العمال", path: "/workers" },
  { icon: HandCoins, label: "المبيعات والتجار", path: "/sales" },
  { icon: ClipboardPlus, label: "العمليات اليومية", path: "/operations" },
  { icon: HeartPulse, label: "الصحة والتحصين", path: "/health" },
  { icon: Scale, label: "الأوزان والنمو", path: "/growth" },
  { icon: FileBarChart2, label: "التقارير", path: "/reports" },
  { icon: ShieldCheck, label: "إدارة الوصول", path: "/access" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return <div dir="rtl" className="page-grid flex min-h-screen items-center justify-center p-5"><div className="soft-card w-full max-w-md overflow-hidden p-8 text-center"><div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Drumstick className="h-8 w-8" /></div><div className="flex flex-col items-center gap-3"><p className="text-sm font-bold text-primary">مزارع</p><h1 className="text-2xl font-extrabold tracking-tight">إدارة دقيقة لدورات التسمين</h1><p className="text-sm leading-7 text-muted-foreground">سجّل الدخول للوصول إلى مزارعك ودوراتك وسجل المتابعة اليومي.</p></div><Button onClick={() => startLogin()} size="lg" className="mt-8 w-full bg-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">تسجيل الدخول إلى النظام</Button></div></div>;
  }
  return <SidebarProvider><DashboardLayoutContent>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();
  useEffect(() => { document.documentElement.dir = "rtl"; document.documentElement.lang = "ar"; }, []);

  return <><Sidebar side="right" collapsible="icon" className="border-l-0"><SidebarHeader className="h-16 shrink-0 justify-center border-b border-sidebar-border/70 md:h-20"><div className="flex w-full items-center gap-3 px-3"><button onClick={toggleSidebar} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" aria-label="طي القائمة الجانبية"><ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} /></button>{!isCollapsed && <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#dfeecb] text-[#2e623e]"><Drumstick className="h-4 w-4" /></span><span className="font-extrabold tracking-tight text-sidebar-foreground">مزارع</span></div>}</div></SidebarHeader><SidebarContent className="min-h-0 flex-1 gap-0 overflow-y-auto overscroll-contain"><SidebarMenu className="px-3 py-2.5 md:py-5">{menuItems.map((item) => { const isActive = location === item.path; return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} className={`h-9 rounded-xl text-sm font-semibold transition-all md:h-11 md:text-base ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"}`}><item.icon className={`h-4 w-4 ${isActive ? "text-[#dfeecb]" : ""}`} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu></SidebarContent><SidebarFooter className="shrink-0 border-t border-sidebar-border/70 p-2.5 md:p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-right hover:bg-sidebar-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center md:py-2"><Avatar className="h-8 w-8 shrink-0 border-0 bg-[#dfeecb] md:h-9 md:w-9"><AvatarFallback className="bg-[#dfeecb] text-xs font-bold text-[#285c3b]">{user?.name?.charAt(0) || "م"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-bold leading-none text-sidebar-foreground">{user?.name || "مستخدم"}</p><p className="mt-1 truncate text-xs text-sidebar-foreground/60 md:mt-1.5">{user?.email || ""}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-48"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="ml-2 h-4 w-4" /><span>تسجيل الخروج</span></DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><SidebarInset>{isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9 rounded-lg bg-card" /><span className="font-bold">{activeMenuItem?.label ?? "لوحة المتابعة"}</span></div>}<main className="page-grid flex-1 p-4 md:p-6">{children}</main></SidebarInset></>;
}
