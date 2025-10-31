// app/product/[id]/page.tsx
// This is a Server Component by default

import { notFound } from 'next/navigation';
import { AppHeader } from "@/components/layout/app-header";
import { AppNav } from "@/components/layout/app-nav";
import { getCurrentUser } from "@/lib/auth/hooks"; // Your auth hook
import ApplicationDetailsClient from './ApplicationDetailsClient'; // The new client component
import { fetchApplicationById, fetchApplicationHistory } from '@/lib/data/applicationDetail';


export default async function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const applicationId = (await params).slug;

  // Fetch user profile on the server
  const profile = await getCurrentUser();
  if (!profile) {

    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <AppNav />
        <div className="p-6">
          <p className="text-slate-600">Please log in to view this page.</p>
        </div>
      </div>
    );
  }


  const application = await fetchApplicationById(applicationId);
  const history = await fetchApplicationHistory(applicationId);
  

  if (!application) {
    notFound(); 
  }

  
  return (
    <ApplicationDetailsClient
      initialApplication={application}
      initialHistory={history}
      profile={profile}
      applicationId={applicationId}
    />
   
  );
}