/**
 * auth.ts — full NextAuth configuration (Node.js runtime only)
 *
 * Do NOT import this from middleware. Middleware uses src/auth.config.ts,
 * which is Edge-safe. This file adds the DB-backed Credentials provider.
 *
 * Rate limiting is handled by src/lib/rate-limit.ts (single shared Map).
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { isLocked, trackFailed, clearAttempts } from '@/lib/rate-limit';

if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
        'NEXTAUTH_SECRET environment variable is not set. ' +
        'Generate one with: openssl rand -base64 32'
    );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email:    { label: 'Email',    type: 'email'    },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email    = (credentials?.email    as string || '').toLowerCase().trim();
                const password =  credentials?.password as string || '';

                if (!email || !password) return null;

                try {
                    if (isLocked(email)) return null;

                    const db   = getDb();
                    const user = db.prepare('SELECT * FROM employees WHERE email = ?').get(email) as any;

                    if (!user) {
                        trackFailed(email);
                        // Audit: unknown email
                        try {
                            db.prepare(`INSERT INTO audit_logs (action, detail) VALUES ('login.failed', ?)`).run(`Failed login attempt for unknown email: ${email}`);
                        } catch { /* */ }
                        return null;
                    }

                    // Password check — auto-upgrade plaintext to bcrypt
                    let isMatch = false;
                    if (user.password?.startsWith('$2')) {
                        isMatch = await bcrypt.compare(password, user.password);
                    } else if (user.password) {
                        isMatch = user.password === password;
                        if (isMatch) {
                            const hashed = await bcrypt.hash(password, 12);
                            db.prepare('UPDATE employees SET password = ? WHERE id = ?').run(hashed, user.id);
                        }
                    }

                    if (!isMatch) {
                        trackFailed(email);
                        try {
                            db.prepare(`INSERT INTO audit_logs (actor_id, actor_name, action, detail) VALUES (?, ?, 'login.failed', ?)`).run(user.id, `${user.firstName} ${user.lastName}`, `Wrong password for ${email}`);
                        } catch { /* */ }
                        return null;
                    }

                    clearAttempts(email);

                    // Audit: successful login
                    try {
                        const db2 = getDb();
                        db2.prepare(`
                            INSERT INTO audit_logs (actor_id, actor_name, action, detail)
                            VALUES (?, ?, 'login.success', ?)
                        `).run(user.id, `${user.firstName} ${user.lastName}`, `Login from ${user.email}`);
                    } catch { /* never block login */ }

                    return {
                        id:             user.id,
                        email:          user.email,
                        name:           `${user.firstName} ${user.lastName}`.trim(),
                        firstName:      user.firstName,
                        lastName:       user.lastName,
                        role:           user.role,
                        group:          user.group,
                        employeeNumber: user.employeeNumber,
                        position:       user.position,
                        phone:          user.phone,
                    } as any;
                } catch {
                    return null;
                }
            },
        }),
    ],

});
