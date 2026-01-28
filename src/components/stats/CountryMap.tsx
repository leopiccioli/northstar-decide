import { useState, useMemo, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getCountryByEnglishName, getCountryName, getCountryFlag } from '@/lib/countries';
import { MIN_RESPONSES_THRESHOLD, QUARTILE_COLORS } from '@/config/stats';
import type { CountryFullStat } from '@/types/stats';
import type { QuartileBoundaries } from './StatsLegend';

const GEO_URL = '/maps/countries-110m.json';

interface CountryMapProps {
  stats: CountryFullStat[];
  isLoading?: boolean;
  quartileBoundaries: QuartileBoundaries | null;
}

function getTwitterUrl(countryName: string, flag: string): string {
  const text = `Estoy armando el mapa de satisfacción laboral por país.

Necesito más datos de ${countryName} ${flag}

Solo toma 2 minutos: 3d.ceoencamiseta.com

#3Dlaborales`;

  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function formatValue(value: number): string {
  return value.toFixed(1);
}

function getCountryColor(stat: CountryFullStat | undefined, quartiles: QuartileBoundaries | null): string {
  if (!stat) return QUARTILE_COLORS.noData;
  if (stat.count < MIN_RESPONSES_THRESHOLD) return QUARTILE_COLORS.insufficient;
  
  if (!quartiles) return QUARTILE_COLORS.q2; // Fallback
  
  const avg = stat.promedio;
  if (avg >= quartiles.q3) return QUARTILE_COLORS.q4;
  if (avg >= quartiles.q2) return QUARTILE_COLORS.q3;
  if (avg >= quartiles.q1) return QUARTILE_COLORS.q2;
  return QUARTILE_COLORS.q1;
}

export function CountryMap({ stats, isLoading, quartileBoundaries }: CountryMapProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  // Create a lookup map for quick access
  const statsMap = useMemo(() => {
    const map = new Map<string, CountryFullStat>();
    stats.forEach(s => map.set(s.country, s));
    return map;
  }, [stats]);

  const handleCountryClick = useCallback((
    geoName: string,
    event: React.MouseEvent<SVGPathElement>
  ) => {
    const country = getCountryByEnglishName(geoName);
    if (!country) return;
    
    setSelectedCountry(country.code);
    setPopoverPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const selectedStat = selectedCountry ? statsMap.get(selectedCountry) : null;
  const selectedName = selectedCountry ? getCountryName(selectedCountry) : '';
  const selectedFlag = selectedCountry ? getCountryFlag(selectedCountry) : '';

  if (isLoading) {
    return (
      <div className="w-full aspect-[2/1] bg-secondary rounded-sm animate-pulse flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [0, 30],
        }}
        className="w-full"
        style={{ maxHeight: '60vh' }}
      >
        <ZoomableGroup
          zoom={1}
          minZoom={0.8}
          maxZoom={5}
          center={[0, 20]}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName = geo.properties.name;
                const country = getCountryByEnglishName(geoName);
                const stat = country ? statsMap.get(country.code) : undefined;
                const fillColor = getCountryColor(stat, quartileBoundaries);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="hsl(var(--border))"
                    strokeWidth={0.75}
                    style={{
                      default: { outline: 'none' },
                      hover: { 
                        outline: 'none',
                        fill: fillColor === QUARTILE_COLORS.noData || fillColor === QUARTILE_COLORS.insufficient ? fillColor : '#000',
                        cursor: 'pointer',
                      },
                      pressed: { outline: 'none' },
                    }}
                    onClick={(e) => handleCountryClick(geoName, e)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Popover for selected country */}
      <Popover open={!!selectedCountry} onOpenChange={(open) => !open && setSelectedCountry(null)}>
        <PopoverTrigger asChild>
          <div
            className="fixed w-0 h-0"
            style={{
              left: popoverPosition.x,
              top: popoverPosition.y,
            }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" side="top" align="center">
          <div className="space-y-2">
            <div className="font-medium text-base">
              {selectedFlag} {selectedName}
            </div>
            
            {selectedStat && selectedStat.count >= MIN_RESPONSES_THRESHOLD ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Dinero:</span>
                  <span className="font-mono">{formatValue(selectedStat.dinero)}</span>
                  <span className="text-muted-foreground">Desarrollo:</span>
                  <span className="font-mono">{formatValue(selectedStat.desarrollo)}</span>
                  <span className="text-muted-foreground">Diversión:</span>
                  <span className="font-mono">{formatValue(selectedStat.diversion)}</span>
                  <span className="text-muted-foreground font-medium">Promedio:</span>
                  <span className="font-mono font-medium">{formatValue(selectedStat.promedio)}</span>
                </div>
                <div className="text-xs text-muted-foreground pt-1 border-t">
                  {selectedStat.count.toLocaleString()} respuestas
                </div>
              </>
            ) : selectedStat ? (
              <>
                <div className="text-sm text-muted-foreground">
                  Datos insuficientes ({selectedStat.count} respuestas)
                </div>
                <a
                  href={getTwitterUrl(selectedName, selectedFlag)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline hover:text-primary/80 block"
                >
                  Pedí ayuda en Twitter →
                </a>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">Sin datos</div>
                <a
                  href={getTwitterUrl(selectedName, selectedFlag)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline hover:text-primary/80 block"
                >
                  Pedí ayuda en Twitter →
                </a>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Re-export for backwards compatibility
export type { CountryFullStat as CountryStatData };
