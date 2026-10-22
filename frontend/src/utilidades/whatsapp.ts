/** wa.me exige el indicativo: a un celular colombiano de 10 dígitos se le antepone el 57. */
export function numeroWhatsapp(valor: string): string {
  const digitos = valor.replace(/\D/g, '')
  return digitos.length === 10 && digitos.startsWith('3') ? `57${digitos}` : digitos
}

export function enlaceWhatsapp(numero: string, mensaje?: string): string {
  return `https://wa.me/${numeroWhatsapp(numero)}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`
}

/** "3001234567" → "300 123 4567", como se lee un celular en Colombia. */
export function telefonoLegible(valor: string): string {
  const digitos = valor.replace(/\D/g, '')
  return digitos.length === 10 ? `${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6)}` : valor
}
