import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Zap,
  History,
  AtomIcon,
  LogIn,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("userChange")); // notify all listeners
    navigate("/");
  };

  // Navigation items for unauthenticated users
  const publicNavigation = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Login", href: "/login", icon: LogIn },
    { name: "Signup", href: "/signup", icon: UserPlus },
  ];

  // Navigation items for authenticated users
  const protectedNavigation = [
    { name: "Generate", href: "/generate", icon: Zap },
    { name: "History", href: "/history", icon: History },
  ];

  // Choose navigation based on authentication state
  const navigation = isAuthenticated ? protectedNavigation : publicNavigation;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neon-darker via-neon-dark to-neon-light">
      <header className="bg-black/80 backdrop-blur-lg border-b border-neon-pink/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img src="/logo.jpeg" alt="BelvCrysta Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shadow-neon-pink animate-neon-pulse" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                  BelvCrysta
                </h1>
                <p className="text-xs text-neon-cyan hidden sm:block">AI Crystal Discovery</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-neon-pink/20 text-neon-pink border border-neon-pink/30"
                        : "text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10"
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side - only show logout for authenticated users */}
            {isAuthenticated && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">
                  Hi, {user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-400 hover:text-neon-pink transition-colors"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
