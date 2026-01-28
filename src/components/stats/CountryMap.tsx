import { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { getCountryByEnglishName, getCountryName } from '@/lib/countries';

const GEO_URL = '/maps/countries-110m.json';

export interface CountryStatData {
  country: string;
  avg: number;
  count: number;
}

interface CountryMapProps {
  stats: CountryStatData[];
  isLoading?: boolean;
}

function getQuintileColor(value: number, allValues: number[]): string {
  if (allValues.length === 0) return '#f5f5f5';
  
  const sorted = [...allValues].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.2)];
  const q2 = sorted[Math.floor(sorted.length * 0.4)];
  const q3 = sorted[Math.floor(sorted.length * 0.6)];
  const q4 = sorted[Math.floor(sorted.length * 0.8)];

  if (value <= q1) return '#e5e5e5';
  if (value <= q2) return '#b5b5b5';
  if (value <= q3) return '#858585';
  if (value <= q4) return '#555555';
  return '#252525';
}

function getCountryColor(
  geoName: string,
  stats: CountryStatData[],
  allAverages: number[]
): string {
  const country = getCountryByEnglishName(geoName);
  if (!country) return '#f5f5f5'; // Not in our list
  
  const stat = stats.find(s => s.country === country.code);
  if (!stat) return '#f5f5f5'; // No data
  if (stat.count < 10) return '#fcd34d'; // Insufficient data
  
  return getQuintileColor(stat.avg, allAverages);
}

export function CountryMap({ stats, isLoading }: CountryMapProps) {
  const [tooltipContent, setTooltipContent] = useState<{
    name: string;
    avg: number | null;
    count: number;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Pre-calculate all averages for quintile calculation (only countries with >= 10 responses)
  const allAverages = useMemo(() => {
    return stats.filter(s => s.count >= 10).map(s => s.avg);
  }, [stats]);

  const handleMouseEnter = (
    geoName: string,
    event: React.MouseEvent<SVGPathElement>
  ) => {
    const country = getCountryByEnglishName(geoName);
    if (!country) {
      setTooltipContent(null);
      return;
    }

    const stat = stats.find(s => s.country === country.code);
    setTooltipContent({
      name: getCountryName(country.code),
      avg: stat?.avg ?? null,
      count: stat?.count ?? 0,
    });
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setTooltipContent(null);
  };

  const handleMouseMove = (event: React.MouseEvent<SVGPathElement>) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

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
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName = geo.properties.name;
                const fillColor = getCountryColor(geoName, stats, allAverages);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="hsl(var(--border))"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { 
                        outline: 'none',
                        fill: fillColor === '#f5f5f5' ? fillColor : '#000',
                        cursor: 'pointer',
                      },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={(e) => handleMouseEnter(geoName, e)}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-sm shadow-lg border border-border pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
          }}
        >
          <div className="font-medium">{tooltipContent.name}</div>
          {tooltipContent.avg !== null ? (
            <>
              <div className="text-muted-foreground">
                Promedio: <span className="font-mono">{tooltipContent.avg}</span>
              </div>
              <div className="text-muted-foreground">
                Respuestas: <span className="font-mono">{tooltipContent.count}</span>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Sin datos</div>
          )}
        </div>
      )}
    </div>
  );
}
