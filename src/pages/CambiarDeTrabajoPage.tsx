import { LandingShell } from '@/components/landing/LandingShell';
import { LANDING_BY_PATH } from '@/content/landings';
import { Link } from 'react-router-dom';

export default function CambiarDeTrabajoPage() {
  const def = LANDING_BY_PATH['/cambiar-de-trabajo'];
  return (
    <LandingShell
      {...def}
      belowForm={
        <div className="space-y-3 text-center">
          <h2 className="text-xl font-semibold">Según tu etapa</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/cambiar-de-trabajo-a-los-40" className="card-option text-base font-medium">
              Cambiar de trabajo a los 40
            </Link>
            <Link to="/cambiar-de-trabajo-a-los-50" className="card-option text-base font-medium">
              Cambiar de trabajo a los 50
            </Link>
          </div>
        </div>
      }
    />
  );
}
