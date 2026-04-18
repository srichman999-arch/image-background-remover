// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

// 你的 NextAuth 配置
const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // 你其他的 provider 保留不变
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  // 其他配置保留
});

// 必须这样导出 GET 和 POST，这是 Next.js 16 App Router 要求的
export { handler as GET, handler as POST };
