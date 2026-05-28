import { useMemo } from 'react';

interface Props {
  updatedAt: string | null;
  className?: string;
}

/**
 * Muestra cuándo se actualizaron los datos de las stats pages.
 * El cron corre 1x/día (3am UTC), por eso aclaramos la frecuencia:
 * si alguien responde después de las 3am no se ve reflejado hasta el día siguiente.
 */
export function StatsFreshness({ updatedAt, className = '' }: Props) {
  const formatted = useMemo(() => {
    if (!updatedAt) return null;
    return new Date(updatedAt).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    });
  }, [updatedAt]);

  if (!formatted) {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>
        Se actualiza 1 vez por día. Si recién respondiste, vas a aparecer mañana.
      </p>
    );
  }

  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      Actualizado: {formatted} · se actualiza 1 vez por día. Si recién respondiste, vas a aparecer mañana.
    </p>
  );
}
