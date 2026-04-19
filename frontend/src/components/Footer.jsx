const Footer = () => (
  <footer className="bg-slate-50 border-t border-slate-200/15 w-full py-12 px-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
      <div>
        <span className="text-lg font-bold text-slate-900 mb-4 block">LocalGigs</span>
        <p className="text-slate-500 max-w-sm text-sm">© 2024 LocalGigs. Hyperlocal Editorial Marketplace.</p>
      </div>
      <div className="grid grid-cols-3 gap-8">
        <FooterLinks title="Platform" links={['How it Works', 'Browse Gigs']} />
        <FooterLinks title="Legal" links={['Terms', 'Privacy']} />
        <FooterLinks title="Help" links={['Contact', 'Businesses']} />
      </div>
    </div>
  </footer>
);

const FooterLinks = ({ title, links }) => (
  <div className="flex flex-col gap-3">
    <span className="text-[0.6875rem] font-bold text-slate-900 uppercase tracking-widest mb-2">{title}</span>
    {links.map((link) => (
      <a key={link} className="text-slate-500 text-sm hover:underline hover:text-blue-600 transition-all" href="#">{link}</a>
    ))}
  </div>
);

export default Footer;