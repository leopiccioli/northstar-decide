export interface Country {
  code: string;      // ISO 3166-1 alpha-2
  name: string;      // Spanish name (for UI)
  nameEn: string;    // English name (for TopoJSON mapping)
}

export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina', nameEn: 'Argentina' },
  { code: 'BO', name: 'Bolivia', nameEn: 'Bolivia' },
  { code: 'BR', name: 'Brasil', nameEn: 'Brazil' },
  { code: 'CA', name: 'Canadá', nameEn: 'Canada' },
  { code: 'CL', name: 'Chile', nameEn: 'Chile' },
  { code: 'CO', name: 'Colombia', nameEn: 'Colombia' },
  { code: 'CR', name: 'Costa Rica', nameEn: 'Costa Rica' },
  { code: 'DE', name: 'Alemania', nameEn: 'Germany' },
  { code: 'DO', name: 'República Dominicana', nameEn: 'Dominican Rep.' },
  { code: 'EC', name: 'Ecuador', nameEn: 'Ecuador' },
  { code: 'ES', name: 'España', nameEn: 'Spain' },
  { code: 'GT', name: 'Guatemala', nameEn: 'Guatemala' },
  { code: 'HN', name: 'Honduras', nameEn: 'Honduras' },
  { code: 'IL', name: 'Israel', nameEn: 'Israel' },
  { code: 'IT', name: 'Italia', nameEn: 'Italy' },
  { code: 'JP', name: 'Japón', nameEn: 'Japan' },
  { code: 'MX', name: 'México', nameEn: 'Mexico' },
  { code: 'NI', name: 'Nicaragua', nameEn: 'Nicaragua' },
  { code: 'PA', name: 'Panamá', nameEn: 'Panama' },
  { code: 'PE', name: 'Perú', nameEn: 'Peru' },
  { code: 'PR', name: 'Puerto Rico', nameEn: 'Puerto Rico' },
  { code: 'PT', name: 'Portugal', nameEn: 'Portugal' },
  { code: 'PY', name: 'Paraguay', nameEn: 'Paraguay' },
  { code: 'SV', name: 'El Salvador', nameEn: 'El Salvador' },
  { code: 'US', name: 'Estados Unidos', nameEn: 'United States of America' },
  { code: 'UY', name: 'Uruguay', nameEn: 'Uruguay' },
  { code: 'VE', name: 'Venezuela', nameEn: 'Venezuela' },
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
