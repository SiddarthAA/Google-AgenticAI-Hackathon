"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
import {
  Radio,
  Menu,
  X,
  User,
  Home,
  Gift,
  Headphones,
  LogOut,
  ChevronDown,
  AlertTriangle,
  Newspaper,
} from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/auth", { replace: true });
    } catch (e) {
      alert("Logout failed. Please try again.");
    }
  };

  const navLinks = [
    { to: "/home", label: "Dashboard", icon: Home },
    // { to: "/rewards", label: "Rewards", icon: Gift },
    { to: "/radio", label: "Radio", icon: Headphones },
    { to: "/report", label: "Report Issue", icon: AlertTriangle },
    // { to: "/news", label: "News", icon: Newspaper }, // <-- Add this!
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="flex items-center">
                <span className="text-xl font-bold text-white">Bangalore</span>
                <span className="text-sm text-blue-400 ml-1 font-medium">
                  .now
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group"
                  >
                    <IconComponent className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    {link.label}
                  </Link>
                );
              })}

              {/* Profile Dropdown */}
              <div className="relative ml-4">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mr-2 group-hover:scale-105 transition-transform duration-200">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden lg:inline">Profile</span>
                  <ChevronDown
                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl py-2">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3" />
                      View Profile
                    </Link>
                    <div className="border-t border-white/10 my-2" />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    {link.label}
                  </Link>
                );
              })}

              <div className="border-t border-white/10 my-4" />

              {/* Mobile Profile Section */}
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mr-3">
                  <User className="w-4 h-4 text-white" />
                </div>
                Profile
              </Link>

              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-3 py-3 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Profile Dropdown Overlay */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-40 hidden md:block"
          onClick={() => setProfileOpen(false)}
        />
      )}
    </>
  );
}
