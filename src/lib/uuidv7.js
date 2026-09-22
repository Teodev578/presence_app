/**
 * Générateur UUIDv7 conforme RFC 9562
 * Encode un horodatage milliseconde 48-bit assurant l'ordonnancement temporel
 * et l'efficacité des index B-Tree PostgreSQL sans dépendance externe.
 */
export function generateUUIDv7() {
  const now = Date.now()
  const bytes = new Uint8Array(16)

  // Aléatoire cryptographique
  crypto.getRandomValues(bytes)

  // Timestamp 48-bit (big-endian)
  bytes[0] = (now / 0x10000000000) & 0xff
  bytes[1] = (now / 0x100000000) & 0xff
  bytes[2] = (now / 0x1000000) & 0xff
  bytes[3] = (now / 0x10000) & 0xff
  bytes[4] = (now / 0x100) & 0xff
  bytes[5] = now & 0xff

  // Version 7 (0111) sur les 4 bits de poids fort de l'octet 6
  bytes[6] = (bytes[6] & 0x0f) | 0x70

  // Variant RFC 4122 / 9562 (10xx) sur les 2 bits de poids fort de l'octet 8
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  // Formatage chaîne canonique xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}
