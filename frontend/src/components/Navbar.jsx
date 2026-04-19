import Link from 'next/link'

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-sm flex justify-between items-center px-8 py-4 max-w-7xl mx-auto left-0 right-0">
    <div className="flex items-center gap-2">
      <span className="text-2xl font-black tracking-tight text-blue-700">LocalGigs</span>
    </div>
    <div className="hidden md:flex items-center gap-8">
      <a className="text-slate-600 font-medium hover:text-blue-500 transition-colors" href="#how-it-works">How it Works</a>
      <a className="text-slate-600 font-medium hover:text-blue-500 transition-colors" href="#">Browse Gigs</a>
      <a className="text-slate-600 font-medium hover:text-blue-500 transition-colors" href="#">Success Stories</a>
    </div>
    <div className="flex items-center gap-4">
      <Link href="/auth">
        <button className="px-5 py-2 text-slate-600 font-medium hover:bg-primary/5 rounded-xl transition-all">Login</button>
      
      </Link>
      <Link href="/auth">
        <button className="px-6 py-2 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl active:scale-95 duration-200 ease-in-out shadow-sm">Join Now</button>
      
      </Link>
    </div>
  </nav>
);

export default Navbar;