
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { CAMPUS_DATA, RECTORIA_EMAILS, SIMULATION_CONFIG } from "@/config/campus-config";

// Renueva el access token usando el refresh token guardado
async function refreshAccessToken(token: any) {
    try {
        const url = "https://oauth2.googleapis.com/token";
        const body = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken,
        });

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
        });

        const refreshed = await response.json();

        if (!response.ok) {
            console.error("[AUTH] Error renovando token:", refreshed);
            return { ...token, error: "RefreshAccessTokenError" };
        }

        console.log("[AUTH] Token renovado exitosamente");
        return {
            ...token,
            accessToken: refreshed.access_token,
            // El refresh token podría rotarse, usar el nuevo si viene, si no mantener el anterior
            refreshToken: refreshed.refresh_token ?? token.refreshToken,
            accessTokenExpires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
            error: undefined,
        };
    } catch (error) {
        console.error("[AUTH] Excepción renovando token:", error);
        return { ...token, error: "RefreshAccessTokenError" };
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/spreadsheets",
                    // access_type=offline es CRÍTICO para obtener refresh_token
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Primera vez que inicia sesión: guardar todos los tokens
            if (account) {
                console.log("[AUTH] Login inicial - guardando tokens");
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    // expires_at de NextAuth viene en segundos, convertir a ms
                    accessTokenExpires: account.expires_at
                        ? account.expires_at * 1000
                        : Date.now() + 3600 * 1000,
                };
            }

            // Token aún válido (con 5 min de margen)
            if (Date.now() < (token.accessTokenExpires as number) - 5 * 60 * 1000) {
                return token;
            }

            // Sin refresh token: no se puede renovar (sesión antigua sin offline access)
            if (!token.refreshToken) {
                console.warn("[AUTH] Token expirado y sin refresh_token. El usuario debe re-loguearse.");
                return token; // devolver el token viejo — fallará en Sheets pero no crashea
            }

            // Token expirado: renovar automáticamente
            console.log("[AUTH] Access token expirado, renovando con refresh_token...");
            return refreshAccessToken(token);
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user && session.user.email) {
                let email = session.user.email.toLowerCase();
                let role = "GUEST";
                let campus = null;

                const sim = SIMULATION_CONFIG[email];
                if (sim) {
                    role = sim.role;
                    campus = sim.campus;
                    if (sim.mockEmail) {
                        session.user.email = sim.mockEmail;
                    }
                } else if (RECTORIA_EMAILS.map((e: any) => e.toLowerCase()).includes(email)) {
                    role = "RECTOR";
                } else {
                    for (const [campusName, data] of Object.entries(CAMPUS_DATA)) {
                        const directores = data.emails_directora.map(e => e.toLowerCase());
                        const coordinadores = data.emails_coordinadores.map(e => e.toLowerCase());

                        if (directores.includes(email)) {
                            role = "DIRECTORA";
                            campus = campusName;
                            break;
                        }
                        if (coordinadores.includes(email)) {
                            role = "COORDINADORA";
                            campus = campusName;
                            break;
                        }
                    }
                }

                session.user.role = role;
                session.user.campus = campus;
                session.accessToken = token.accessToken;
                session.error = token.error; // propagar errores de refresh al cliente
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
    secret: process.env.AUTH_SECRET,
});

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        error?: string;
        user: {
            role?: string;
            campus?: string;
        } & DefaultSession["user"];
    }
}
