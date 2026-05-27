"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Users, Briefcase, FileText, CheckCircle2, XCircle, Package, DollarSign, Star } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/lib/api';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';

interface Freelancer {
  fullName: string;
  matchPercent: number;
  profile?: {
    preferredJobType?: string;
    profilePicLink?: string;
  };
}

interface AccountStats {
  fullName?: string;
  email?: string;
  isVerified: boolean;
  isEmailVerified: boolean;
  isPhoneNumberVerified: boolean;
  nomadScore: number;
  profilePicLink: string | null;
  location: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
  bannerLink?: string | null;
}

interface Financials {
  lifetimeSpentGross: number;
  lifetimeFeesPaid: number;
  lifetimeNetSpent: number;
}

const BusinessDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<AccountStats | null>(null);
  const [stats, setStats] = useState({
    activeGigs: 0,
    totalHired: 0,
    pendingProposals: 0,
    completedGigs: 0,
    cancelledGigs: 0,
    totalProducts: 0
  });
  const [financials, setFinancials] = useState<Financials>({
    lifetimeSpentGross: 0,
    lifetimeFeesPaid: 0,
    lifetimeNetSpent: 0
  });
  const [recommendations, setRecommendations] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, recsRes] = await Promise.all([
        api.get('/api/v1/client/get-profile-data'),
        api.get('/api/v1/client/recommendations')
      ]);

      if (profileRes.data.success) {
        const { account, activeGigs, totalHired, pendingProposals, completedGigs, cancelledGigs, totalProducts, financials } = profileRes.data.data;

        setAccount(account);
        setStats({
          activeGigs,
          totalHired,
          pendingProposals,
          completedGigs,
          cancelledGigs,
          totalProducts
        });
        setFinancials(financials);

        if (!account.bio || account.bio.length < 10 || !account.location || !account.phoneNumber) {
          setNeedsOnboarding(true);
        }
      }
      if (recsRes.data.success) {
        setRecommendations(recsRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingIndicator type="line-spinner" size="md" label="Initializing Business Dashboard..." />
      </div>
    </DashboardLayout>
  );

  if (needsOnboarding) {
    return (
      <DashboardLayout>
        <Card className="max-w-xl mx-auto mt-20 text-center shadow-lg">
          <CardHeader className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Briefcase className="size-10" />
            </div>
            <CardTitle className="text-3xl">Welcome, {user?.fullName}!</CardTitle>
            <CardDescription className="text-base">
              Before you can start hiring local expert nomads, we need to set up your business profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => router.push('/client/profile')}
            >
              Set Up Business Profile
            </Button>
            <p className="text-xs text-muted-foreground mt-4 uppercase tracking-widest font-medium">
              Takes less than 2 minutes
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Hello, {account?.fullName || user?.fullName || 'Business Owner'}
              {account?.isVerified && (
                <ShieldCheck className="size-6 text-primary" />
              )}
            </h1>
            <p className="text-muted-foreground">Manage corporate tasks and match local freelancers.</p>
          </div>

          {account && (
            <Card className="flex items-center gap-4 px-4 py-3 min-w-[200px] shadow-sm">
              <div className="flex size-10 rounded-lg bg-primary text-primary-foreground items-center justify-center font-bold">
                N⚡
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Nomad Score</span>
                <span className="text-xl font-bold leading-none">
                  {account.nomadScore} <span className="text-sm font-medium text-muted-foreground">/ 100</span>
                </span>
              </div>
            </Card>
          )}
        </header>

        {/* Bento Grid Layer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
              <Briefcase className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGigs}</div>
              <p className="text-xs text-muted-foreground mt-1">Active Gigs</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hired</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHired}</div>
              <p className="text-xs text-muted-foreground mt-1">Freelancers</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-primary text-primary-foreground border-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wider">Review Required</CardTitle>
              <FileText className="size-4 text-primary-foreground/80" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="text-2xl font-bold">{stats.pendingProposals} Pending Proposals</div>
              <Button variant="secondary" size="sm" className="w-fit text-primary">
                Review Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Supplemental Operational Metrics Grid Layer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-none bg-muted/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Completed Contracts</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-muted-foreground" />
              <span className="text-xl font-bold">{stats.completedGigs}</span>
            </CardContent>
          </Card>

          <Card className="shadow-none bg-muted/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Cancelled Contracts</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <XCircle className="size-4 text-muted-foreground" />
              <span className="text-xl font-bold">{stats.cancelledGigs}</span>
            </CardContent>
          </Card>

          <Card className="shadow-none bg-muted/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Store Inventory</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              <span className="text-xl font-bold">{stats.totalProducts}</span>
            </CardContent>
          </Card>

          <Card className="shadow-none bg-slate-900 text-slate-50 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Capital Outflow</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-2xl font-bold">
                <DollarSign className="size-5" />
                {(financials.lifetimeSpentGross ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-slate-400">
                Net: ${(financials.lifetimeNetSpent ?? 0).toFixed(2)} • Fees: ${(financials.lifetimeFeesPaid ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Matching Feed Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Matching Feed</h2>
          </div>
          
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((freelancer, idx) => (
                <Card key={idx} className="flex flex-col overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-start justify-between pb-4">
                    <Avatar className="size-12 border">
                      <AvatarImage src={freelancer.profile?.profilePicLink || "https://res.cloudinary.com/dmv76qdpx/image/upload/v1713727931/default-avatar_vqc9tw.png"} alt={freelancer.fullName} />
                      <AvatarFallback>{freelancer.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Badge variant="secondary" className="font-medium">
                      {freelancer.matchPercent}% Match
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1 pb-4">
                    <CardTitle className="text-lg">{freelancer.fullName}</CardTitle>
                    <CardDescription className="font-medium">{freelancer.profile?.preferredJobType || "Professional"}</CardDescription>
                  </CardContent>
                  <CardFooter className="flex items-center gap-4 pt-0 text-sm text-muted-foreground mt-auto">
                    <div className="flex items-center gap-1">
                      <Star className="size-4 fill-primary text-primary" />
                      <span className="font-medium">4.9</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Nearby</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16 text-center shadow-none bg-muted/30 border-dashed">
              <Users className="size-10 text-muted-foreground mb-4 opacity-50" />
              <CardTitle className="text-lg mb-2">No matching freelancers found</CardTitle>
              <CardDescription>Post a gig with specific skills to see recommendations.</CardDescription>
            </Card>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default BusinessDashboard;