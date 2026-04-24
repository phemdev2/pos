'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function UserDropdown() {
  const router = useRouter();
  const { profile, logout } = useAuthStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = profile?.role === 'admin';

  // Close dropdown if clicking outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!profile) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 hover:bg-slate-800 rounded-lg py-1.5 px-2 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
          {profile.full_name?.substring(0, 1).toUpperCase() || 'U'}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-200 leading-tight capitalize">{profile.full_name}</p>
          <p className="text-[10px] text-gray-500 leading-tight capitalize">{profile.role}</p>
        </div>
        <i className={`fas fa-chevron-down text-[10px] text-gray-500 transition-transform hidden md:block ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] animate-fade-in overflow-hidden">
          
          {/* Profile Header */}
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow">
                {profile.full_name?.substring(0, 1).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 truncate capitalize">{profile.full_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Links */}
          <div className="p-2">
                        <button 
              onClick={() => { setIsOpen(false); router.push('/dashboard'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <i className="fas fa-chart-line w-4 text-center"></i>
              Dashboard
            </button>
            {/* Only show Admin link if user is an admin */}
            {isAdmin && (
                
              <button 
                onClick={() => { setIsOpen(false); router.push('/admin'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors text-left"
              >
                <i className="fas fa-users-cog w-4 text-center"></i>
                Staff Management
              </button>
            )}

            <button 
              onClick={() => { setIsOpen(false); router.push('/pos'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <i className="fas fa-cash-register w-4 text-center"></i>
              Back to POS
            </button>
          </div>

          {/* Footer / Logout */}
          <div className="border-t border-gray-100 p-2 bg-red-50/50">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}