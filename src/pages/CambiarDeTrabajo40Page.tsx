import { LandingShell } from '@/components/landing/LandingShell';
import { Link } from 'react-router-dom';

const faq = [
  {
    q: '¿Es tarde para cambiar de trabajo a los 40?',
    a: 'No. A los 40 tenés algo que no tenías a los 25: criterio. El problema no es la edad, es decidir sin medir. Este test ordena las 3 dimensiones que importan.',
  },
  {
    q: '¿Qué priorizar a esta edad?',
    a: 'Depende de tu situación. Algunos priorizan estabilidad (Dinero), otros crecimiento profesional (Desarrollo), otros calidad de vida (Diversión). El test te muestra dónde estás parado hoy.',
  },
  {
    q: '¿Y la estabilidad familiar?',
    a: 'Es un factor real que el framework no mide directamente, pero que cargás vos al interpretar el resultado. La medición es la materia prima; la decisión sigue siendo tuya.',
  },
  {
    q: '¿Conviene cambiar de rubro a los 40?',
    a: 'Es más común de lo que parece. Lo que importa no es el rubro nuevo, sino si tus 3D actuales están más bajas que las que tendrías en el cambio.',
  },
];

export default function CambiarDeTrabajo40Page() {
  return (
    <LandingShell
      title="Cambiar de trabajo a los 40 — Test en 20 segundos"
      description="¿Cambiar de trabajo a los 40? Test anónimo para medir tu situación en 3 dimensiones: Dinero, Desarrollo, Diversión."
      path="/cambiar-de-trabajo-a-los-40"
      h1="Cambiar de trabajo a los 40"
      subhead="A esta edad cada movimiento pesa más. Medilo antes de decidir."
      initialContext="change"
      landingId="cambiar-trabajo-40"
      faq={faq}
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
