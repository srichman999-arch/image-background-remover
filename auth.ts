import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { D1Adapter } from "@auth/d1-adapter"

// 获取 D1 数据库绑定
const getDB = () => {
  if (typeof (globalThis as any).DB !== 'undefined') {
    return (globalThis as any).DB
  }
  // 开发环境使用环境变量
  return process.env.DB
}

const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  adapter: D1Adapter(getDB()),
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  callbacks: {
    async jwt({ token, user, account }: any) {
      // 初始登录时保存用户信息
      if (user) {
        token.id = user.id
      }
      // 保存 provider 信息
      if (account) {
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }: any) {
      // 将 token 信息添加到 session
      if (token && session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    },
  },
}

const authResult = NextAuth(authConfig)

export const handlers = authResult.handlers
export const signIn = authResult.signIn
export const signOut = authResult.signOut
export const auth = authResult.auth
