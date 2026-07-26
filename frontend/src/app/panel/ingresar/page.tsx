import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Ingresar' }

/**
 * Login de dueños de tienda.
 *
 * El formulario es todavía una maqueta: la autenticación real entra con
 * NextAuth/Auth.js contra el modelo Usuario, en la fase del panel.
 */
export default function PaginaIngresar() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Entra a tu tienda</h1>
      <p className="mt-1 text-sm text-slate-500">Administra productos, diseño y pedidos.</p>

      <form className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Correo</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Contraseña</span>
          <input
            type="password"
            name="contrasena"
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
        </label>

        <button
          type="submit"
          disabled
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-40"
        >
          Ingresar
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        Autenticación pendiente: NextAuth/Auth.js
      </p>
    </div>
  )
}
