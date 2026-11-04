/**
 * auth.config.ts — Edge-safe NextAuth config
 *
 * Imported by middleware (Edge Runtime). It must NOT import anything that
 * touches Node.js APIs, directly or via dynamic import(): no db, bcrypt,
 * fs, path. Webpack bundles import() targets into the Edge bundle too.
 *
 * The Credentials provider (DB + bcrypt) lives in src/auth.ts, which is
 * only used from Node.js routes / server actions. Middleware only needs to
 * verify the JWT session, which needs no providers.
 */
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    providers: [],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id             = (user as any).id;
                token.role           = (user as any).role;
                token.firstName      = (user as any).firstName;
                token.lastName       = (user as any).lastName;
                token.group          = (user as any).group;
                token.employeeNumber = (user as any).employeeNumber;
                token.position       = (user as any).position;
                token.phone          = (user as any).phone;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id             = token.id             as string;
            session.user.role           = token.role           as string;
            session.user.firstName      = token.firstName      as string;
            session.user.lastName       = token.lastName       as string;
            session.user.group          = token.group          as string;
            session.user.employeeNumber = token.employeeNumber as string;
            session.user.position       = token.position       as string;
            session.user.phone          = token.phone          as string;
            return session;
        },
    },

    pages: {
        signIn: '/login',
        error:  '/login',
    },

    session: {
        strategy: 'jwt',
        maxAge:   8 * 60 * 60, // 8 hours
    },

    trustHost: true,
    secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
