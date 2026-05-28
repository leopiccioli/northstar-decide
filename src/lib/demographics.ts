// Listas alineadas con Quiz Master Pro para consistencia entre proyectos.
// Si se editan acá, actualizar también el trigger validate_demographics en la DB.

export const SECTORS = [
  "Tecnología / Software",
  "Finanzas / Banca / Seguros",
  "Consultoría",
  "Salud",
  "Educación",
  "Retail / Comercio",
  "Industria / Manufactura",
  "Construcción",
  "Gobierno / Sector público",
  "Medios / Comunicación",
  "Agro",
  "Energía",
  "Hospitalidad / Turismo",
  "ONG / Tercer sector",
  "Otro",
] as const;

export const AGE_RANGES = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

export type Sector = typeof SECTORS[number];
export type AgeRange = typeof AGE_RANGES[number];

export function isValidSector(value: unknown): value is Sector {
  return typeof value === "string" && (SECTORS as readonly string[]).includes(value);
}

export function isValidAgeRange(value: unknown): value is AgeRange {
  return typeof value === "string" && (AGE_RANGES as readonly string[]).includes(value);
}
