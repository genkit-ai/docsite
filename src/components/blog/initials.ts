/** Up to two uppercase initials for an author name, e.g. "Cameron Balahan" → "CB". */
export const authorInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
