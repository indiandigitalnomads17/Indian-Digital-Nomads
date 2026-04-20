"use client";
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';

const Navbar = () => {
  const { user, authenticated, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex justify-between items-center px-8 py-5 mx-auto left-0 right-0">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#2563EB]">
            LocalGigs
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          <a className="text-[#64748B] text-sm font-semibold hover:text-[#2563EB] transition-colors" href="#how-it-works">How it Works</a>
          <a className="text-[#64748B] text-sm font-semibold hover:text-[#2563EB] transition-colors" href="#">Browse Gigs</a>
          <a className="text-[#64748B] text-sm font-semibold hover:text-[#2563EB] transition-colors" href="#">Success Stories</a>
        </div>
        
        <div className="flex items-center gap-4">
          {authenticated ? (
            <div className="flex items-center gap-6">
              <Link 
                href={user?.role === 'FREELANCER' ? '/freelancer' : '/dashboard'}
                className="text-[#0B1C30] text-sm font-bold hover:text-[#2563EB] transition-colors"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <span className="text-[#0B1C30] text-sm font-semibold">
                  {user?.fullName}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              </div>
              <button 
                onClick={logout}
                className="text-red-500 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link href="/auth">
                <button className="px-6 py-2.5 text-[#0B1C30] font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all">
                  Login
                </button>
              </Link>
              <Link href="/auth">
                <button className="px-8 py-2.5 bg-[#2563EB] text-white font-bold text-sm rounded-2xl active:scale-95 duration-200 ease-in-out shadow-lg shadow-blue-500/20">
                  Join Now
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;