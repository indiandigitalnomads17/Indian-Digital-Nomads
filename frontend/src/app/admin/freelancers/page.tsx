"use client";
import nextDynamic from 'next/dynamic';

const AdminFreelancersWorkspace = nextDynamic(
  () => import('./AdminFreelancersWorkspace'),
  { ssr: false }
);

export default function Page() {
  return <AdminFreelancersWorkspace />;
}