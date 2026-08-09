import { LandingShell } from '@/components/landing/LandingShell';
import { LANDING_BY_PATH } from '@/content/landings';

export default function TestBurnoutPage() {
  const def = LANDING_BY_PATH['/test-burnout'];
  return <LandingShell {...def} />;
}
