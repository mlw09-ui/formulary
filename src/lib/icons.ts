/**
 * Line icons for domain and field cards (24×24 viewBox, stroke-based).
 * taxonomy.yaml refers to these by name; the schema rejects unknown names.
 */
export const ICONS = {
  // Domains
  physics:
    '<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-20 12 12)"/>',
  mathematics: '<path d="M18 4H6l6 8-6 8h12"/>',
  // Physics fields
  mechanics:
    '<path d="M6 3h12"/><path d="M12 3l4.5 11"/><circle cx="17.3" cy="16.8" r="2.8"/><path d="M5 21h14" stroke-dasharray="2 2"/>',
  fluid:
    '<path d="M3 8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M3 13c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M3 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/>',
  aero:
    '<path d="M3 13c4-4.5 10-5.5 18-2.5-6.5 3-12.5 4-18 2.5z"/><path d="M2 7h7M15 5h7M4 19h9"/>',
  thermo:
    '<path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/><path d="M17 6h3M17 10h3"/>',
  em: '<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>',
  waves: '<path d="M2 12c1.7-5 3.3-5 5 0s3.3 5 5 0 3.3-5 5 0 3.3 5 5 0"/>',
  modern:
    '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  // Mathematics fields
  algebra:
    '<path d="M12 4v16"/><path d="M8 20h8"/><path d="M4 7h16"/><path d="M6 7l-3 7a3 3 0 0 0 6 0z"/><path d="M18 7l-3 7a3 3 0 0 0 6 0z"/>',
  geometry: '<path d="M4 20 20 20 4 4z"/><path d="M4 16h4v4"/>',
  calculus:
    '<path d="M15 3c-2-.5-3 .5-3 2.5v13c0 2-1 3-3 2.5"/><path d="M3 21h18" opacity=".5"/>',
  linalg: '<path d="M4 20V4M4 20h16"/><path d="M4 20 15 9"/><path d="M15 9h-4M15 9v4"/><path d="M4 20l5-12"/><path d="M9 8l-2.6 2.4M9 8l.6 3.4"/>',
  stats: '<path d="M3 20h18"/><path d="M3 19c3.5 0 5-13 9-13s5.5 13 9 13"/><path d="M12 6v14" stroke-dasharray="2 2"/>',
  complex:
    '<path d="M3 12h18M12 3v18"/><circle cx="12" cy="12" r="6.5"/><path d="M12 12l4.6-4.6"/><circle cx="16.6" cy="7.4" r="1" fill="currentColor"/>',
} as const;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as [IconName, ...IconName[]];
