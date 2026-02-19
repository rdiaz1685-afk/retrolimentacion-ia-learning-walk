
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { CAMPUS_DATA, RECTORIA_EMAILS, SIMULATION_CONFIG } from "@/config/campus-config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/spreadsheets.readonly",
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            // Initial sign in
            if (account && user) {
                return {
                    accessToken: account.access_token,
                    accessTokenExpires: Date.now() + (account.expires_in ?? 3600) * 1000,
                    refreshToken: account.refresh_token,
                    user,
                };
            }

            // Return previous token if the access token has not expired yet
            if (Date.now() < (token.accessTokenExpires as number)) {
                return token;
            }

            // Access token has expired, try to update it
            return refreshAccessToken(token);
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user && session.user.email) {
                let email = session.user.email.toLowerCase();
                let role = "GUEST";
                let campus = null;

                // Aplicar simulación si existe para este correo
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
                session.error = token.error;
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
    secret: process.env.AUTH_SECRET,
});

async function refreshAccessToken(token: any) {
    try {
        const url = "https://oauth2.googleapis.com/token";
        const response = await fetch(url, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            method: "POST",
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            }),
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
        };
    } catch (error) {
        console.error("Error refreshing access token", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

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
