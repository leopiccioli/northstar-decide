import { LandingShell } from '@/components/landing/LandingShell';

const faq = [
  {
    q: '¿Qué es el burnout?',
    a: 'Un estado de agotamiento físico, mental y emocional sostenido en el tiempo, asociado al trabajo. No es un mal día: es una respuesta del cuerpo a meses o años de sobrecarga sin recuperación.',
  },
  {
    q: '¿Cómo sé si tengo burnout?',
    a: 'Algunas señales: cansancio que no se va con el fin de semana, cinismo o distancia con tu trabajo, sensación de no rendir como antes. Este test mide 3 dimensiones (Dinero, Desarrollo, Diversión) para ver dónde está el problema.',
  },
  {
    q: '¿Este test reemplaza un diagnóstico médico?',
    a: 'No. Es una herramienta de auto-medición para ordenar tu cabeza, no un diagnóstico clínico. Si te sentís mal, consultá con un profesional de la salud.',
  },
  {
    q: '¿Es anónimo?',
    a: 'Sí. No pedimos nombre ni datos personales. Si dejás tu email es solo para mandarte el resultado.',
  },
  {
    q: '¿Cuánto tarda?',
    a: '20 segundos. Tres sliders y listo.',
  },
];

export default function TestBurnoutPage() {
  return (
    <LandingShell
      title="Test de burnout en 20 segundos — 3D para Decidir"
      description="Test anónimo para medir tu nivel de burnout laboral en 20 segundos. 3 dimensiones: Dinero, Desarrollo, Diversión."
      path="/test-burnout"
      h1="Test de burnout en 20 segundos"
      subhead="Medí cuánto te está costando tu trabajo en 3 dimensiones: Dinero, Desarrollo, Diversión."
      initialContext="burnout"
      landingId="test-burnout"
      faq={faq}
    />
  );
}
