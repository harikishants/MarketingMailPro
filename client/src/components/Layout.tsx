import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart4,
  Mail,
  Settings,
  LayoutDashboard,
  Users,
  FileText,
  Menu,
  User
} from "lucide-react";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavLink = ({ href, icon, label, isActive }: NavLinkProps) => {
  return (
    <li>
      <Link href={href}>
        <a
          className={cn(
            "flex items-center px-4 py-3 font-medium hover:bg-neutral-50",
            isActive
              ? "text-primary bg-primary bg-opacity-10"
              : "text-neutral-600"
          )}
        >
          {icon}
          {label}
        </a>
      </Link>
    </li>
  );
};

interface SidebarProps {
  currentPath: string;
}

const Sidebar = ({ currentPath }: SidebarProps) => {
  const navItems = [
    { href: "/", icon: <LayoutDashboard className="mr-3 h-5 w-5" />, label: "Dashboard" },
    { href: "/campaigns", icon: <Mail className="mr-3 h-5 w-5" />, label: "Campaigns" },
    { href: "/contacts", icon: <Users className="mr-3 h-5 w-5" />, label: "Contacts" },
    { href: "/templates", icon: <FileText className="mr-3 h-5 w-5" />, label: "Templates" },
    { href: "/analytics", icon: <BarChart4 className="mr-3 h-5 w-5" />, label: "Analytics" },
    { href: "/settings", icon: <Settings className="mr-3 h-5 w-5" />, label: "Settings" },
  ];

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-neutral-100 h-full">
      <div className="p-4 border-b border-neutral-100">
        <h1 className="text-xl font-semibold text-neutral-800 flex items-center">
          <Mail className="mr-2 h-5 w-5 text-primary" />
          BulkMail Pro
        </h1>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.href}
            />
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-neutral-100">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-800">John Smith</p>
            <p className="text-xs text-neutral-600">john@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

interface MobileHeaderProps {
  onMenuClick: () => void;
}

const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
  return (
    <div className="md:hidden w-full bg-white border-b border-neutral-100 fixed top-0 left-0 z-10">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold text-neutral-800 flex items-center">
          <Mail className="mr-2 h-5 w-5 text-primary" />
          BulkMail Pro
        </h1>
        <button className="text-neutral-600" onClick={onMenuClick}>
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {!isMobile ? (
        <Sidebar currentPath={location} />
      ) : (
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <MobileHeader onMenuClick={() => setIsMenuOpen(true)} />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar currentPath={location} />
          </SheetContent>
        </Sheet>
      )}

      <main className="flex-1 overflow-y-auto pt-0 md:pt-0 mt-16 md:mt-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
