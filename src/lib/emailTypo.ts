// Domain typo dictionary - maps common misspellings to correct domains
const DOMAIN_TYPOS: Record<string, string> = {
  // Gmail
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmali.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gimail.com': 'gmail.com',
  // Hotmail
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'hotnail.com': 'hotmail.com',
  // Outlook
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  // Yahoo
  'yaho.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  // iCloud
  'iclod.com': 'icloud.com',
  // Protonmail
  'protonmai.com': 'protonmail.com',
  'protonmial.com': 'protonmail.com',
  // mail.ru special
  'mail,ru': 'mail.ru',
};

// Domain root typos - independent of TLD (.com, .com.ar, .es, etc.)
// Maps misspelled root to correct root, preserving whatever TLD chain follows.
const DOMAIN_ROOT_TYPOS: Record<string, string> = {
  hoymail: 'hotmail',
  hotmial: 'hotmail',
  hotmal: 'hotmail',
  hotmai: 'hotmail',
  hotmil: 'hotmail',
  hotnail: 'hotmail',
  hormail: 'hotmail',
  hotmaill: 'hotmail',
  gmial: 'gmail',
  gamil: 'gmail',
  gmaill: 'gmail',
  gmali: 'gmail',
  gnail: 'gmail',
  yaho: 'yahoo',
  yhaoo: 'yahoo',
  yahooo: 'yahoo',
  outlok: 'outlook',
  outllok: 'outlook',
  outloo: 'outlook',
};

// Domains where .co is a typo for .com (not legitimate .co domains)
const DOT_CO_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'icloud', 'live', 'gmx'];

// Known domains for format normalization (missing dot, double dot, comma)
const KNOWN_DOMAINS = ['gmail', 'hotmail', 'outlook', 'yahoo', 'icloud', 'protonmail', 'live', 'gmx'];

/**
 * Detect common email domain typos and return a suggested correction.
 * Returns the full corrected email or null if no typo detected.
 */
export function detectEmailTypo(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex < 1) return null;

  const localPart = trimmed.slice(0, atIndex);
  let domain = trimmed.slice(atIndex + 1);

  // 1. Direct domain lookup
  if (DOMAIN_TYPOS[domain]) {
    return `${localPart}@${DOMAIN_TYPOS[domain]}`;
  }

  // 1b. Root-of-domain typo, TLD-agnostic (hoymail.com.ar -> hotmail.com.ar)
  const firstDot = domain.indexOf('.');
  if (firstDot > 0) {
    const root = domain.slice(0, firstDot);
    const rest = domain.slice(firstDot); // includes leading dot
    if (DOMAIN_ROOT_TYPOS[root]) {
      return `${localPart}@${DOMAIN_ROOT_TYPOS[root]}${rest}`;
    }
  }

  // 2. Format fixes: comma instead of dot (e.g. gmail,com)
  const commaFixed = domain.replace(',', '.');
  if (commaFixed !== domain && DOMAIN_TYPOS[commaFixed]) {
    return `${localPart}@${DOMAIN_TYPOS[commaFixed]}`;
  }
  // Check if comma-fixed is a known valid domain
  for (const known of KNOWN_DOMAINS) {
    if (commaFixed === `${known}.com` && domain !== commaFixed) {
      return `${localPart}@${commaFixed}`;
    }
  }

  // 3. Double dot (e.g. gmail..com)
  const doubleDotFixed = domain.replace('..', '.');
  if (doubleDotFixed !== domain) {
    for (const known of KNOWN_DOMAINS) {
      if (doubleDotFixed === `${known}.com`) {
        return `${localPart}@${doubleDotFixed}`;
      }
    }
  }

  // 4. Missing dot (e.g. gmailcom)
  for (const known of KNOWN_DOMAINS) {
    if (domain === `${known}com`) {
      return `${localPart}@${known}.com`;
    }
  }

  // 5. TLD typos
  // .con → .com
  if (domain.endsWith('.con')) {
    const base = domain.slice(0, -4);
    for (const known of KNOWN_DOMAINS) {
      if (base === known) return `${localPart}@${known}.com`;
    }
    // me.con → me.com
    if (base === 'me') return `${localPart}@me.com`;
  }

  // .cmo → .com
  if (domain.endsWith('.cmo')) {
    const base = domain.slice(0, -4);
    for (const known of KNOWN_DOMAINS) {
      if (base === known) return `${localPart}@${known}.com`;
    }
  }

  // .cm → .com
  if (domain.endsWith('.cm') && !domain.endsWith('.com')) {
    const base = domain.slice(0, -3);
    for (const known of KNOWN_DOMAINS) {
      if (base === known) return `${localPart}@${known}.com`;
    }
  }

  // .co → .com (only for known domains, not legitimate .co)
  if (domain.endsWith('.co') && !domain.endsWith('.com')) {
    const base = domain.slice(0, -3);
    if (DOT_CO_DOMAINS.includes(base)) {
      return `${localPart}@${base}.com`;
    }
  }

  // 6. Letra extra al final del TLD (.comp, .coml, .como, .comm, .neto, .orgs)
  // TLD-agnóstico: aplica a cualquier dominio (gmail, hotmail, corporativos).
  // No afecta .com.ar / .com.mx porque ahí el TLD final es "ar" / "mx".
  const TRAILING_TLD_TYPOS: Record<string, string> = {
    comp: 'com', coml: 'com', como: 'com', comm: 'com', comn: 'com', comz: 'com', comk: 'com', comj: 'com',
    neto: 'net', nett: 'net',
    orgs: 'org', orgo: 'org',
  };
  const lastDot = domain.lastIndexOf('.');
  if (lastDot > 0) {
    const tld = domain.slice(lastDot + 1);
    if (TRAILING_TLD_TYPOS[tld]) {
      return `${localPart}@${domain.slice(0, lastDot + 1)}${TRAILING_TLD_TYPOS[tld]}`;
    }
  }

  return null;
}
