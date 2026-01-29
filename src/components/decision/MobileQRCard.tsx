import { QRCodeSVG } from 'qrcode.react';
import { Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SITE_CONFIG } from '@/config/urls';
import type { TrackingData } from '@/hooks/useTrackingData';

interface MobileQRCardProps {
  /** Direct URL to encode (overrides default URL building) */
  url?: string;
  /** Original tracking data to preserve in QR URL */
  originalTracking?: TrackingData;
  /** Compact variant for result screen */
  compact?: boolean;
}

export function MobileQRCard({ 
  url,
  originalTracking,
  compact = false,
}: MobileQRCardProps) {
  // If a direct URL is provided, use it (make it absolute if needed)
  let qrUrl: string;
  
  if (url) {
    qrUrl = url.startsWith('http') ? url : `${SITE_CONFIG.baseUrl}${url}`;
  } else {
    // Build URL preserving original tracking params
    const urlObj = new URL(SITE_CONFIG.baseUrl);
    
    if (originalTracking) {
      if (originalTracking.utm_source) urlObj.searchParams.set('utm_source', originalTracking.utm_source);
      if (originalTracking.utm_medium) urlObj.searchParams.set('utm_medium', originalTracking.utm_medium);
      if (originalTracking.utm_campaign) urlObj.searchParams.set('utm_campaign', originalTracking.utm_campaign);
      if (originalTracking.utm_content) urlObj.searchParams.set('utm_content', originalTracking.utm_content);
      if (originalTracking.utm_term) urlObj.searchParams.set('utm_term', originalTracking.utm_term);
      if (originalTracking.gclid) urlObj.searchParams.set('gclid', originalTracking.gclid);
      if (originalTracking.fbclid) urlObj.searchParams.set('fbclid', originalTracking.fbclid);
    }
    
    qrUrl = urlObj.toString();
  }
  
  if (compact) {
    return (
      <div className="p-4 bg-secondary rounded-sm border border-border text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Smartphone className="w-4 h-4" />
          <span>Para compartir, escaneá desde tu celular</span>
        </div>
        <div className="p-2 bg-white rounded-lg inline-block">
          <QRCodeSVG
            value={qrUrl}
            size={80}
            level="M"
            bgColor="white"
            fgColor="black"
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border bg-secondary/50">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Smartphone className="w-5 h-5" />
          <span>Más potente en tu celular</span>
        </div>
        
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Compartí resultados, pedí segundas opiniones y guardá tu historial al instante.
        </p>
        
        <div className="p-3 bg-white rounded-lg">
          <QRCodeSVG
            value={qrUrl}
            size={120}
            level="M"
            bgColor="white"
            fgColor="black"
          />
        </div>
      </CardContent>
    </Card>
  );
}
