import { DecisionFlow } from '@/components/decision/DecisionFlow';
import { SEO } from '@/components/SEO';

const Index = () => {
  return (
    <>
      <SEO
        title="Las 3D del Trabajo — Dinero, Desarrollo, Diversión"
        description="Tomá mejores decisiones laborales en 20 segundos midiendo tus 3D: Dinero, Desarrollo y Diversión."
        path="/"
      />
      <DecisionFlow />
    </>
  );
};

export default Index;
