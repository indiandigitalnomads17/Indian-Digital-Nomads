"use client";
import nextDynamic from 'next/dynamic';

const AdminBusinessesWorkspace = nextDynamic(
  () => import('./AdminBusinessesWorkspace'),
  { ssr: false }
);

export default function Page() {
  return <AdminBusinessesWorkspace />;
}