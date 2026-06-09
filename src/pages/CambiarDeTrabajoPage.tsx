import { LandingShell } from '@/components/landing/LandingShell';
import { Link } from 'react-router-dom';

const faq = [
  {
    q: '¿Cuándo es buen momento para cambiar de trabajo?',
    a: 'No hay un momento perfecto. Lo que ayuda es medir antes de decidir: ¿qué te da hoy tu trabajo en Dinero, Desarrollo y Diversión? ¿Qué te daría el cambio? Este test ordena esa conversación contigo mismo.',
  },
  {
    q: '¿Cómo sé si debo cambiar de trabajo?',
    a: 'Si dos de las tres D están bajas y no ves cómo subirlas en tu trabajo actual, es señal. Pero la decisión es tuya: el test te da los datos, no la respuesta.',
  },
  {
    q: '¿Y si tengo miedo de cambiar?',
    a: 'El miedo no es razón para quedarse ni para irse. Es información. Medir las 3D te ayuda a separar el miedo de los hechos: cuánto estás perdiendo hoy vs cuánto podrías perder cambiando.',
  },
  {
    q: '¿Funciona si tengo más de 40 o 50 años?',
    a: 'Sí. La edad cambia el peso de cada dimensión, no el framework. Tenemos versiones específicas para esas etapas.',
  },
  {
    q: '¿Es anónimo?',
    a: 'Sí. No pedimos datos personales. El email es opcional, solo para enviarte el resultado.',
  },
];

export default function CambiarDeTrabajoPage() {
  return (
    <LandingShell
      title="¿Cambiar de trabajo? Medilo antes de decidir — 3D"
      description="Test de 20 segundos para decidir si cambiar de trabajo. Medí tu situación actual en 3 dimensiones: Dinero, Desarrollo, Diversión."
      path="/cambiar-de-trabajo"
      h1="¿Cambiar de trabajo? Medilo antes de decidir"
      subhead="20 segundos, 3 dimensiones: Dinero, Desarrollo, Diversión. Sin opinión, solo datos."
      initialContext="change"
      landingId="cambiar-trabajo"
      faq={faq}
      belowForm={
        <div className="space-y-3 text-center">
          <h2 className="text-xl font-semibold">Según tu etapa</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/cambiar-de-trabajo-a-los-40"
              className="card-option text-base font-medium"
            >
              Cambiar de trabajo a los 40
            </Link>
            <Link
              to="/cambiar-de-trabajo-a-los-50"
              className="card-option text-base font-medium"
            >
              Cambiar de trabajo a los 50
            </Link>
          </div>
        </div>
      }
    />
  );
}
