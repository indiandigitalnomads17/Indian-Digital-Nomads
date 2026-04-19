import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import FreelancerCard from '../../components/common/FreelancerCard';

const FREELANCERS = [
  { name: "Alex Johnson", role: "UX/UI Designer", match: "94%", rating: "4.9", dist: "2.5km", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdk9p2gZLiREoZ_G1Qhg7qWq1ERIDDlb39hGL3sNCodxmTf2jEvfLNVU4X6QBoUpFYlCVsSIMWkgaIgm-Xa_fNXy_pAJAEGZLMH9RUe9_iCZsL4j35ssC76sy2tTw_4l8NUbHfdtYCZkRLgmKiBfv4L5qbZIj5YzJJtI7JcqBd_DhBdVkLMpnZMaXG5gqJC7vHynhjBbqTMHkiEbth9ra8hRfqRis7B5axlUras2xSOeXsjc19Rv3_KoiNyITUNw72PezDlRTDe2A" },
  { name: "Maya Rodriguez", role: "Content Strategist", match: "89%", rating: "4.8", dist: "1.2km", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHyQK-vwv3JTUp63S-hY2cB4ZlKbXYwRt4GybDJ5wybq9hhuPte6uc3EW28l3o_LYx6NWdkPc3fPQTO_QcHyo9j8UZMOfuVfIFKT76WT-HZ5ZvbxiRiPBOx3_3eNyDewzVkWvzono_sNapMvkQbjJh5Cff53hKAcwotKIy_TJQ6UamKpob_ql01OxuaQIyyZVR6YPH2TO6RXCfAsrfkmPHLRiFMH9Qb1vwaKx0MTrsxmA3gtthUxHmkVwhGSBLt3MaWpfPU23YCkg" },
  { name: "Jordan Smith", role: "Full Stack Dev", match: "87%", rating: "5.0", dist: "4.0km", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvGy7qLlREs0npWyE3WFC0NALICJOtUP370N4MXj0GOAeriZpOflM4TYNc-6jTZ_nprYN0eS81FpGJb-OJaoUUlKwfBa1j7KTHnJez7EKED1LJW7r5jEnP0u7NoSrsmOA2wuOnCFKja88p1x7kcPcbRjNlkMnoRBTanX77TEOsL3DRQ1k5CLGNm4PzfXhuaM-YIxQh1kCeGfQZFgYYwqeAd6GN0DyX--I0XrBaW9sTxPISsG8fcc6W1kmUulqx35HZDIpLIntIcYk" },
];

const BusinessDashboard = () => {
  return (
    <DashboardLayout>
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tighter mb-2 font-headline">Hello, Acme Corp</h1>
        <p className="text-slate-500 font-medium">Manage your active projects and discover talent.</p>
      </header>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        <StatCard label="Active Projects" value="12" suffix="Gigs" trend="+2" />
        <StatCard label="Total Hired" value="48" suffix="Freelancers" trend="+12%" />
        
        {/* Special Blue Card (Unique) */}
        <div className="hidden lg:flex bg-primary-container text-white p-8 rounded-xl flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-primary-fixed-dim font-bold text-sm mb-1">Weekly Growth</p>
            <h3 className="text-2xl font-bold tracking-tight font-headline">Expand Your Team</h3>
          </div>
          <button className="relative z-10 w-fit bg-white text-primary px-4 py-2 rounded-lg font-bold text-sm">
            View Insights
          </button>
          <span className="absolute -right-4 -bottom-4 opacity-20 material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
        </div>
      </div>

      {/* Feed */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight font-headline">Matching Feed</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FREELANCERS.map((dev, idx) => (
            <FreelancerCard key={idx} data={dev} />
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default BusinessDashboard;