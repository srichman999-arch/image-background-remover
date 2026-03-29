// Cloudflare Worker - 处理 Remove.bg API 请求

export default {
  async fetch(request, env) {
    // 只处理 POST 请求
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: '只支持 POST 请求' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 设置 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理 OPTIONS 请求（CORS 预检）
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 获取 API Key
      const apiKey = env.REMOVE_BG_API_KEY;

      if (!apiKey) {
        console.error('REMOVE_BG_API_KEY not set');
        return new Response(
          JSON.stringify({ error: '服务器配置错误：API密钥未设置' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 解析 multipart/form-data
      const formData = await request.formData();
      const imageFile = formData.get('image');

      if (!imageFile) {
        return new Response(
          JSON.stringify({ error: '未找到图片文件' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(imageFile.type)) {
        return new Response(
          JSON.stringify({ error: '不支持的文件格式，仅支持 JPG 和 PNG' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 验证文件大小（5MB限制）
      const maxSize = 5 * 1024 * 1024;
      if (imageFile.size > maxSize) {
        return new Response(
          JSON.stringify({ error: '文件大小超过限制，最大支持 5MB' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          return new Response(
            JSON.stringify({ error: 'API密钥无效，请检查配置' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 检查是否是额度耗尽
        if (removeBgResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: 'API额度已用完，请充值或稍后重试' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: `背景移除失败：${removeBgResponse.statusText}` }),
          { status: removeBgResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 获取处理后的图片
      const resultBlob = await removeBgResponse.blob();
      console.log('图片处理成功，大小:', `${(resultBlob.size / 1024).toFixed(2)} KB`);

      // 将结果转换为 base64 返回
      const arrayBuffer = await resultBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binaryString);
      const dataUrl = `data:image/png;base64,${base64}`;

      return new Response(
        JSON.stringify({
          success: true,
          resultImage: dataUrl,
          size: resultBlob.size,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('处理图片时发生错误:', error);
      return new Response(
        JSON.stringify({ error: '服务器内部错误，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
