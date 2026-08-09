// Shared landing copy: consumed by the React pages and by the build-time
// prerender script, so the crawler HTML matches the rendered page.

import type { UserContext } from '@/types/decision';
import type { FAQItem } from '@/components/landing/FAQ';

export interface LandingDef {
  path: string;
  title: string;
  description: string;
  h1: string;
  subhead: string;
  initialContext: UserContext;
  landingId: string;
  faq: FAQItem[];
}

export const LANDINGS: LandingDef[] = [
  {
    path: '/test-burnout',
    title: 'Test de burnout en 20 segundos — Las 3D del Trabajo',
    description: 'Test anónimo para medir tu nivel de burnout laboral en 20 segundos. 3 dimensiones: Dinero, Desarrollo, Diversión.',
    h1: 'Test de burnout en 20 segundos',
    subhead: 'Medí cuánto te está costando tu trabajo en 3 dimensiones: Dinero, Desarrollo, Diversión.',
    initialContext: 'burnout',
    landingId: 'test-burnout',
    faq: [
      { q: '¿Qué es el burnout?', a: 'Un estado de agotamiento físico, mental y emocional sostenido en el tiempo, asociado al trabajo. No es un mal día: es una respuesta del cuerpo a meses o años de sobrecarga sin recuperación.' },
      { q: '¿Cómo sé si tengo burnout?', a: 'Algunas señales: cansancio que no se va con el fin de semana, cinismo o distancia con tu trabajo, sensación de no rendir como antes. Este test mide 3 dimensiones (Dinero, Desarrollo, Diversión) para ver dónde está el problema.' },
      { q: '¿Este test reemplaza un diagnóstico médico?', a: 'No. Es una herramienta de auto-medición para ordenar tu cabeza, no un diagnóstico clínico. Si te sentís mal, consultá con un profesional de la salud.' },
      { q: '¿Es anónimo?', a: 'Sí. No pedimos nombre ni datos personales. Si dejás tu email es solo para mandarte el resultado.' },
      { q: '¿Cuánto tarda?', a: '20 segundos. Tres sliders y listo.' },
    ],
  },
  {
    path: '/cambiar-de-trabajo',
    title: '¿Cambiar de trabajo? Medilo antes de decidir — 3D',
    description: 'Test de 20 segundos para decidir si cambiar de trabajo. Medí tu situación actual en 3 dimensiones: Dinero, Desarrollo, Diversión.',
    h1: '¿Cambiar de trabajo? Medilo antes de decidir',
    subhead: '20 segundos, 3 dimensiones: Dinero, Desarrollo, Diversión. Sin opinión, solo datos.',
    initialContext: 'change',
    landingId: 'cambiar-trabajo',
    faq: [
      { q: '¿Cuándo es buen momento para cambiar de trabajo?', a: 'No hay un momento perfecto. Lo que ayuda es medir antes de decidir: ¿qué te da hoy tu trabajo en Dinero, Desarrollo y Diversión? ¿Qué te daría el cambio? Este test ordena esa conversación contigo mismo.' },
      { q: '¿Cómo sé si debo cambiar de trabajo?', a: 'Si dos de las tres D están bajas y no ves cómo subirlas en tu trabajo actual, es señal. Pero la decisión es tuya: el test te da los datos, no la respuesta.' },
      { q: '¿Y si tengo miedo de cambiar?', a: 'El miedo no es razón para quedarse ni para irse. Es información. Medir las 3D te ayuda a separar el miedo de los hechos: cuánto estás perdiendo hoy vs cuánto podrías perder cambiando.' },
      { q: '¿Funciona si tengo más de 40 o 50 años?', a: 'Sí. La edad cambia el peso de cada dimensión, no el framework. Tenemos versiones específicas para esas etapas.' },
      { q: '¿Es anónimo?', a: 'Sí. No pedimos datos personales. El email es opcional, solo para enviarte el resultado.' },
    ],
  },
  {
    path: '/cambiar-de-trabajo-a-los-40',
    title: 'Cambiar de trabajo a los 40 — Test en 20 segundos',
    description: '¿Cambiar de trabajo a los 40? Test anónimo para medir tu situación en 3 dimensiones: Dinero, Desarrollo, Diversión.',
    h1: 'Cambiar de trabajo a los 40',
    subhead: 'A esta edad cada movimiento pesa más. Medilo antes de decidir.',
    initialContext: 'change',
    landingId: 'cambiar-trabajo-40',
    faq: [
      { q: '¿Es tarde para cambiar de trabajo a los 40?', a: 'No. A los 40 tenés algo que no tenías a los 25: criterio. El problema no es la edad, es decidir sin medir. Este test ordena las 3 dimensiones que importan.' },
      { q: '¿Qué priorizar a esta edad?', a: 'Depende de tu situación. Algunos priorizan estabilidad (Dinero), otros crecimiento profesional (Desarrollo), otros calidad de vida (Diversión). El test te muestra dónde estás parado hoy.' },
      { q: '¿Y la estabilidad familiar?', a: 'Es un factor real que el framework no mide directamente, pero que cargás vos al interpretar el resultado. La medición es la materia prima; la decisión sigue siendo tuya.' },
      { q: '¿Conviene cambiar de rubro a los 40?', a: 'Es más común de lo que parece. Lo que importa no es el rubro nuevo, sino si tus 3D actuales están más bajas que las que tendrías en el cambio.' },
    ],
  },
  {
    path: '/cambiar-de-trabajo-a-los-50',
    title: 'Cambiar de trabajo a los 50 — Test en 20 segundos',
    description: '¿Cambiar de trabajo a los 50? Test anónimo para medir tu situación en 3 dimensiones: Dinero, Desarrollo, Diversión.',
    h1: 'Cambiar de trabajo a los 50',
    subhead: 'La experiencia es tu activo. Medí si tu trabajo actual la está aprovechando.',
    initialContext: 'change',
    landingId: 'cambiar-trabajo-50',
    faq: [
      { q: '¿Conviene cambiar de trabajo a los 50?', a: 'Sí, si el cambio mejora tus 3D. A los 50 la experiencia es tu activo más valioso: el test te ayuda a ver si tu trabajo actual la está aprovechando o desperdiciando.' },
      { q: '¿Qué buscar en un trabajo a esta edad?', a: 'Lo mismo que a cualquier edad, pero con otro peso: Dinero (estabilidad y aprovechamiento de la experiencia), Desarrollo (seguir aprendiendo o transmitir), Diversión (no llegar al final agotado).' },
      { q: '¿Y el riesgo de quedarme sin trabajo?', a: 'Es un riesgo real. El framework no lo elimina; te muestra cuánto estás perdiendo quedándote, para que esa decisión la tomes con datos en vez de con miedo.' },
      { q: '¿Sirve para pensar el retiro o un cambio gradual?', a: 'Sí. Muchos a los 50 no buscan un cambio drástico sino reajustar las 3D: bajar la intensidad, subir el sentido, mantener el ingreso. El test te ordena esa conversación.' },
    ],
  },
];

export const LANDING_BY_PATH: Record<string, LandingDef> = Object.fromEntries(
  LANDINGS.map((l) => [l.path, l]),
);
