// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"

// NextAuth v5 只需要这一行导出
export const { GET, POST } = handlers
