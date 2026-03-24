// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Admin-only routes
    const adminRoutes = ['/dashboard/users', '/dashboard/reports', '/dashboard/audit', '/dashboard/system', '/api/admin']
    const isAdminRoute = adminRoutes.some(r => pathname.startsWith(r))

    if (isAdminRoute && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/api/users/:path*', '/api/reports/:path*', '/api/audit/:path*'],
}
