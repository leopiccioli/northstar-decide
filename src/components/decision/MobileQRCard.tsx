import { QRCodeSVG } from 'qrcode.react';
import { Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const BASE_URL = 'https://3d.ceoencamiseta.com';

interface MobileQRCardProps {
  /** Additional UTM context for tracking */
  context?: string;
  /** Source identifier (default: 'qr') */
  source?: string;
  /** Medium identifier (default: 'desktop') */
  medium?: string;
  /** Compact variant for result screen */
  compact?: boolean;
}

export function MobileQRCard({ 
  context,
  source = 'qr',
  medium = 'desktop',
  compact = false,
}: MobileQRCardProps) {
  // Build URL with UTM params
  const qrUrl = new URL(BASE_URL);
  qrUrl.searchParams.set('utm_source', source);
  qrUrl.searchParams.set('utm_medium', medium);
  qrUrl.searchParams.set('utm_campaign', 'mobile_redirect');
  if (context) {
    qrUrl.searchParams.set('context', context);
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
            value={qrUrl.toString()}
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
          <span>Versión más potente en tu teléfono</span>
        </div>
        
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Compartí resultados, pedí segundas opiniones y guardá tu historial al instante.
        </p>
        
        <div className="p-3 bg-white rounded-lg">
          <QRCodeSVG
            value={qrUrl.toString()}
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
