import { LandingShell } from '@/components/landing/LandingShell';
import { Link } from 'react-router-dom';

const faq = [
  {
    q: '¿Conviene cambiar de trabajo a los 50?',
    a: 'Sí, si el cambio mejora tus 3D. A los 50 la experiencia es tu activo más valioso: el test te ayuda a ver si tu trabajo actual la está aprovechando o desperdiciando.',
  },
  {
    q: '¿Qué buscar en un trabajo a esta edad?',
    a: 'Lo mismo que a cualquier edad, pero con otro peso: Dinero (estabilidad y aprovechamiento de la experiencia), Desarrollo (seguir aprendiendo o transmitir), Diversión (no llegar al final agotado).',
  },
  {
    q: '¿Y el riesgo de quedarme sin trabajo?',
    a: 'Es un riesgo real. El framework no lo elimina; te muestra cuánto estás perdiendo quedándote, para que esa decisión la tomes con datos en vez de con miedo.',
  },
  {
    q: '¿Sirve para pensar el retiro o un cambio gradual?',
    a: 'Sí. Muchos a los 50 no buscan un cambio drástico sino reajustar las 3D: bajar la intensidad, subir el sentido, mantener el ingreso. El test te ordena esa conversación.',
  },
];

export default function CambiarDeTrabajo50Page() {
  return (
    <LandingShell
      title="Cambiar de trabajo a los 50 — Test en 20 segundos"
      description="¿Cambiar de trabajo a los 50? Test anónimo para medir tu situación en 3 dimensiones: Dinero, Desarrollo, Diversión."
      path="/cambiar-de-trabajo-a-los-50"
      h1="Cambiar de trabajo a los 50"
      subhead="La experiencia es tu activo. Medí si tu trabajo actual la está aprovechando."
      initialContext="change"
      landingId="cambiar-trabajo-50"
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
