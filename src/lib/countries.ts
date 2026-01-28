export interface Country {
  code: string;      // ISO 3166-1 alpha-2
  name: string;      // Spanish name (for UI)
  nameEn: string;    // English name (for TopoJSON mapping)
  flag: string;      // Emoji flag
}

export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina', nameEn: 'Argentina', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', nameEn: 'Bolivia', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', nameEn: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canadá', nameEn: 'Canada', flag: '🇨🇦' },
  { code: 'CL', name: 'Chile', nameEn: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', nameEn: 'Colombia', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', nameEn: 'Costa Rica', flag: '🇨🇷' },
  { code: 'DE', name: 'Alemania', nameEn: 'Germany', flag: '🇩🇪' },
  { code: 'DO', name: 'República Dominicana', nameEn: 'Dominican Rep.', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', nameEn: 'Ecuador', flag: '🇪🇨' },
  { code: 'ES', name: 'España', nameEn: 'Spain', flag: '🇪🇸' },
  { code: 'GT', name: 'Guatemala', nameEn: 'Guatemala', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', nameEn: 'Honduras', flag: '🇭🇳' },
  { code: 'IL', name: 'Israel', nameEn: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italia', nameEn: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japón', nameEn: 'Japan', flag: '🇯🇵' },
  { code: 'MX', name: 'México', nameEn: 'Mexico', flag: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua', nameEn: 'Nicaragua', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá', nameEn: 'Panama', flag: '🇵🇦' },
  { code: 'PE', name: 'Perú', nameEn: 'Peru', flag: '🇵🇪' },
  { code: 'PR', name: 'Puerto Rico', nameEn: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'PT', name: 'Portugal', nameEn: 'Portugal', flag: '🇵🇹' },
  { code: 'PY', name: 'Paraguay', nameEn: 'Paraguay', flag: '🇵🇾' },
  { code: 'SV', name: 'El Salvador', nameEn: 'El Salvador', flag: '🇸🇻' },
  { code: 'US', name: 'Estados Unidos', nameEn: 'United States of America', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', nameEn: 'Uruguay', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', nameEn: 'Venezuela', flag: '🇻🇪' },
].sort((a, b) => a.name.localeCompare(b.name, 'es'));

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCountryByEnglishName(nameEn: string): Country | undefined {
  return COUNTRIES.find(c => c.nameEn === nameEn);
}

export function getCountryName(code: string): string {
  return getCountryByCode(code)?.name ?? code;
}

export function getCountryFlag(code: string): string {
  return getCountryByCode(code)?.flag ?? '';
}
