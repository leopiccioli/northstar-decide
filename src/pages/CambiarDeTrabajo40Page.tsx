import { LandingShell } from '@/components/landing/LandingShell';
import { LANDING_BY_PATH } from '@/content/landings';
import { Link } from 'react-router-dom';

export default function CambiarDeTrabajo40Page() {
  const def = LANDING_BY_PATH['/cambiar-de-trabajo-a-los-40'];
  return (
    <LandingShell
      {...def}
      belowForm={
        <div className="text-center">
          <Link to="/cambiar-de-trabajo" className="text-sm text-foreground/60 underline">
            ¿Querés la versión general? →
          </Link>
        </div>
      }
    />
  );
}
