import {
  LayoutGrid,
  Users,
  FileEdit,
  TrendingUp,
  FolderKanban,
  CreditCard,
  BarChart3,
  Wallet,
  Megaphone,
  Settings,
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutGrid },
  { label: "Users", path: "/users", icon: Users },
  { label: "Prompt Management", path: "/prompts", icon: FileEdit },
  { label: "Trending Prompts", path: "/trending", icon: TrendingUp },
  { label: "Categories", path: "/categories", icon: FolderKanban },
  { label: "Subscription Plans", path: "/subscriptions", icon: CreditCard },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Revenue", path: "/revenue", icon: Wallet },
  { label: "Announcements", path: "/announcements", icon: Megaphone },
  { label: "Settings", path: "/settings", icon: Settings },
];
