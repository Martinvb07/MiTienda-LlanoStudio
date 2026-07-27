/**
 * Catálogo de plantillas.
 *
 * Vive en su propio módulo, sin 'use client', a propósito: cuando un componente
 * de servidor importa un valor desde un archivo marcado como cliente, Next lo
 * sustituye por una referencia y el array deja de comportarse como tal. Los
 * datos y el componente que los pinta tienen que estar separados.
 */

export interface DatosPlantilla {
  nombre: string
  categoria: string
  desde: string
  hasta: string
  columnas: 2 | 3
  destacada?: boolean
}

export const PLANTILLAS: DatosPlantilla[] = [
  {
    nombre: 'Colección de Moda',
    categoria: 'Ropa y accesorios',
    desde: 'from-[#1e293b]',
    hasta: 'to-[#475569]',
    columnas: 2,
  },
  {
    nombre: 'Tecnología & Gadgets',
    categoria: 'Electrónica',
    desde: 'from-sitio-azul',
    hasta: 'to-sitio-profundo',
    columnas: 3,
    destacada: true,
  },
  {
    nombre: 'Hogar & Estilo de Vida',
    categoria: 'Decoración',
    desde: 'from-[#b45309]',
    hasta: 'to-[#78350f]',
    columnas: 2,
  },
  {
    nombre: 'Café y Antojos',
    categoria: 'Alimentos y bebidas',
    desde: 'from-[#78350f]',
    hasta: 'to-[#292524]',
    columnas: 3,
  },
  {
    nombre: 'Artesanía Colombiana',
    categoria: 'Hecho a mano',
    desde: 'from-[#0f766e]',
    hasta: 'to-[#134e4a]',
    columnas: 2,
  },
  {
    nombre: 'Belleza y Cuidado',
    categoria: 'Cosmética',
    desde: 'from-[#be185d]',
    hasta: 'to-[#701a3f]',
    columnas: 3,
  },
]
