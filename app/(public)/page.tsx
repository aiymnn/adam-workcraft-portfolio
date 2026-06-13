import {
  getServerPublicProfile,
  getServerPublicCollection,
  getServerPublicVaults,
  getServerPublicReviews,
} from '@/lib/services/server-public-data';
import LandingWrapper from '@/components/layout/landing-wrapper';

// Opt out of static generation to ensure fresh data from DB on every request.
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch all necessary data simultaneously on the server.
  const [profile, aboutMedia, servicesMedia, vaults, reviews] = await Promise.all([
    getServerPublicProfile(),
    getServerPublicCollection('about'),
    getServerPublicCollection('expertise'),
    getServerPublicVaults(8),
    getServerPublicReviews(10),
  ]);

  return (
    <LandingWrapper
      profile={profile}
      aboutMedia={aboutMedia}
      servicesMedia={servicesMedia}
      vaults={vaults}
      reviews={reviews}
    />
  );
}
