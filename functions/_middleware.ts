// Cloudflare Pages Functions Middleware
// 用于处理 NextAuth 在 Cloudflare Pages 上的运行

import { NextRequest, NextResponse } from 'next/server';

export async function onRequest(context: any) {
  // 将 D1 数据库绑定注入到全局
  if (context.env.DB) {
    (globalThis as any).DB = context.env.DB;
  }
  
  // 继续处理请求
  return context.next();
}
