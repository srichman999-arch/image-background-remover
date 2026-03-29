import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 从环境变量获取API Key
    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      console.error('REMOVE_BG_API_KEY not set');
      return NextResponse.json(
        { error: '服务器配置错误：API密钥未设置' },
        { status: 500 }
      );
    }

    // 获取上传的图片
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: '未找到图片文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: '不支持的文件格式，仅支持 JPG 和 PNG' },
        { status: 400 }
      );
    }

    // 验证文件大小（5MB限制）
    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小超过限制，最大支持 5MB' },
        { status: 400 }
      );
    }

    console.log('开始处理图片:', {
      name: imageFile.name,
      type: imageFile.type,
      size: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
    });

    // 准备发送给 Remove.bg 的数据
    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file', imageFile);
    removeBgFormData.append('size', 'auto');

    // 调用 Remove.bg API
    const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: removeBgFormData,
    });

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();
      console.error('Remove.bg API 错误:', {
        status: removeBgResponse.status,
        statusText: removeBgResponse.statusText,
        body: errorText,
      });

      // 检查是否是API密钥错误
      if (removeBgResponse.status === 401) {
        return NextResponse.json(
          { error: 'API密钥无效，请检查配置' },
          { status: 401 }
        );
      }

      // 检查是否是额度耗尽
      if (removeBgResponse.status === 402) {
        return NextResponse.json(
          { error: 'API额度已用完，请充值或稍后重试' },
          { status: 402 }
        );
      }

      return NextResponse.json(
        { error: `背景移除失败：${removeBgResponse.statusText}` },
        { status: removeBgResponse.status }
      );
    }

    // 获取处理后的图片
    const resultBlob = await removeBgResponse.blob();
    console.log('图片处理成功，大小:', `${(resultBlob.size / 1024).toFixed(2)} KB`);

    // 将结果转换为 base64 返回
    const arrayBuffer = await resultBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      success: true,
      resultImage: dataUrl,
      size: resultBlob.size,
    });

  } catch (error) {
    console.error('处理图片时发生错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
