"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  ChartColumnDecreasing,
  ClipboardList,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";

import { MdOutlineAdminPanelSettings } from 'react-icons/md';

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: ChartColumnDecreasing,
  },
  {
    title: "Relatório",
    icon: ClipboardList,
    submenu: [
      {
        title: "Controle de expedição",
        href: "/relatorio-expedicao",
      },
    ],
  },
  {
    title: "Administração",
    icon: MdOutlineAdminPanelSettings,
    submenu: [
      {
        title: "Clientes",
        href: "/clientes",
      },
      {
        title: "Produtos",
        href: "/produtos",
      },
      {
        title: "Usuários",
        href: "/usuarios",
      },
      {
        title: "Veículos",
        href: "/veiculos",
      },
    ],
  },
];

export function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([""]);
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false); // Este estado agora será usado
  const [activeParent, setActiveParent] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const displayName = userName.trim().length > 0 ? userName : "Usuario";

  // Auto-expand parent menu if current route matches a submenu item
  useEffect(() => {
    const parentsToExpand = menuItems
      .filter((item) => item.submenu?.some((s) => s.href === pathname))
      .map((item) => item.title);

    if (parentsToExpand.length) {
      setExpandedItems([parentsToExpand[0]]);
      setActiveParent(parentsToExpand[0]);
    } else {
      setExpandedItems([]);
      setActiveParent(null);
    }
  }, [pathname]);

  // Se o menu for fechado, recolhe os submenus abertos
  useEffect(() => {
    if (collapsed) {
      setExpandedItems([]);
    }
  }, [collapsed]);

  useEffect(() => {
    const loadUserName = () => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        const stored = window.localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserName(parsed?.name ?? parsed?.username ?? "");
        } else {
          setUserName("");
        }
      } catch (err) {
        console.error(err);
        setUserName("");
      }
    };

    loadUserName();
    window.addEventListener("storage", loadUserName);

    return () => {
      window.removeEventListener("storage", loadUserName);
    };
  }, []);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
    setActiveParent(title);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
    }

    setUserName("");
    document.cookie =
      "isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/sign-in");
  };

  return (
    <div
      className={`bg-white border-r border-gray-300 flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-56"
      }`}
    >
      {/* Logo e Botão de Toggle */}
      <div className="p-3 border-b border-gray-200">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div
            className={`flex items-center shrink-0 ${
              collapsed ? "space-x-0" : "space-x-2"
            }`}
          >
            <div className="w-9 h-9 rounded-full border-2 border-yellow-400 flex items-center justify-center bg-white shrink-0">
              <div className="w-5 h-5 relative">
                <Image
                  src="/truck-logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            {!collapsed && (
              <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                TRACK+
              </span>
            )}
          </div>
          {/* Botão de Fechar */}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="shrink-0 text-gray-600 hover:text-gray-900"
            >
              <PanelLeftClose className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Botão de Abrir */}
        {collapsed && (
          <div className="flex justify-center mt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="shrink-0 text-gray-600 hover:text-gray-900"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.submenu ? (
              <div>
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${
                    !collapsed && activeParent === item.title
                      ? "bg-yellow-100 text-yellow-800"
                      : "text-gray-700"
                  } ${
                    collapsed ? "justify-center" : "justify-between"
                  }`}
                  // Desabilita o clique no submenu se o painel estiver fechado
                  disabled={collapsed}
                >
                  <div
                    className={`flex items-center ${
                      collapsed ? "space-x-0" : "space-x-3"
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {/* Oculta o título quando fechado */}
                    {!collapsed && <span>{item.title}</span>}
                  </div>
                  {/* Oculta a seta quando fechado */}
                  {!collapsed &&
                    (expandedItems.includes(item.title) ? (
                      <ChevronDown className="w-5 h-5 shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 shrink-0" />
                    ))}
                </button>
                {/* Oculta o submenu quando fechado */}
                {expandedItems.includes(item.title) && !collapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        className={`block px-3 py-2 text-sm rounded-lg border-b-2 ${
                          pathname === subItem.href
                            ? "border-yellow-400 text-gray-900 font-medium"
                            : "border-transparent text-gray-600"
                        }`}
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${
                  pathname === item.href
                    ? "bg-yellow-100 text-yellow-800"
                    : "text-gray-700"
                } ${
                  // Centraliza o ícone e remove o espaço quando fechado
                  collapsed ? "justify-center space-x-0" : "space-x-3"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {/* Oculta o título quando fechado */}
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-gray-200">
        <div
          className={`flex items-center mb-2 ${
            // Centraliza o ícone do usuário quando fechado
            collapsed ? "justify-center space-x-0" : "space-x-2"
          }`}
        >
          <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          {/* Oculta o nome quando fechado */}
          {!collapsed && (
            <span className="text-sm font-medium text-gray-900 whitespace-nowrap overflow-hidden">
              {displayName}
            </span>
          )}
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className={`w-full text-gray-600 hover:text-gray-900 ${
            // Centraliza o botão de sair quando fechado
            collapsed ? "justify-center" : "justify-start"
          }`}
        >
          {/* Ajusta a margem do ícone quando fechado */}
          <LogOut
            className={`w-6 h-6 shrink-0 ${collapsed ? "mr-0" : "mr-2"}`}
          />
          {/* Oculta o texto quando fechado */}
          {!collapsed && "Sair"}
        </Button>
      </div>
    </div>
  );
}
