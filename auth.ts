import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
}

const authResult = NextAuth(authConfig)

export const handlers = authResult.handlers
export const signIn = authResult.signIn
export const signOut = authResult.signOut
export const auth = authResult.auth
