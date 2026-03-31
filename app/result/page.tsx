'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 组件内容提取到这里，用 Suspense 包裹
function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(1);

  useEffect(() => {
    // 检查数据是否已准备好
    const isReady = sessionStorage.getItem('imageReady');
    const imageData = sessionStorage.getItem('originalImage');

    if (isReady && imageData) {
      setOriginalImage(imageData);
      processImage(imageData);
    } else if (!isReady) {
      // 数据未准备好，稍后重试
      setTimeout(() => {
        const retryImageData = sessionStorage.getItem('originalImage');
        const retryIsReady = sessionStorage.getItem('imageReady');
        if (retryIsReady && retryImageData) {
          setOriginalImage(retryImageData);
          processImage(retryImageData);
        } else {
          setError('未找到图片数据，请重新上传图片');
          setIsProcessing(false);
        }
      }, 200);
    } else {
      setError('未找到图片数据，请重新上传图片');
      setIsProcessing(false);
    }
  }, []);

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStep(1);

    // 创建超时控制器
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000); // 30秒超时

    try {
      setProcessingStep(2); // 开始准备上传

      // 将base64转换为Blob
      // 直接使用 fetch 获取 data URL 的 blob
      const response = await fetch(imageData);
      if (!response.ok) {
        throw new Error('读取图片数据失败');
      }
      const blob = await response.blob();

      setProcessingStep(3); // 开始调用API

      // 创建FormData for Remove.bg API
      const formData = new FormData();
      formData.append('image_file', blob, 'image.jpg');
      formData.append('size', 'auto');

      // 获取API Key
      const apiKey = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY;
      if (!apiKey) {
        throw new Error('API Key 未配置，请检查环境变量');
      }

      // 直接调用 Remove.bg API
      const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      setProcessingStep(4); // API返回，处理结果

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ errors: ['未知错误'] }));
        throw new Error(errorData.errors?.[0] || `API 错误: ${apiResponse.status}`);
      }

      // Remove.bg 返回的是二进制图片数据，需要转换为 base64
      const imageBlob = await apiResponse.blob();
      const reader = new FileReader();
      const resultImage = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });

      setProcessedImage(resultImage);
      // 处理成功后清理sessionStorage
      sessionStorage.removeItem('originalImage');
      sessionStorage.removeItem('imageReady');
    } catch (err) {
      clearTimeout(timeoutId);

      // 处理失败时也清理sessionStorage
      sessionStorage.removeItem('originalImage');
      sessionStorage.removeItem('imageReady');

      if (err instanceof Error && err.name === 'AbortError') {
        setError('请求超时，处理时间超过30秒。可能是图片太大或网络较慢，请尝试更小的图片或稍后重试。');
      } else {
        console.error('处理图片错误:', err);
        setError(err instanceof Error ? err.message : '处理失败，请重试');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'no-background.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRetry = () => {
    if (originalImage) {
      processImage(originalImage);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            图片背景移除工具
          </h1>
        </header>

        {/* 主要内容 */}
        <main className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg">
            {/* 加载中 */}
            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6"></div>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                  正在处理图片...
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  {processingStep >= 1 && (
                    <p className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${processingStep > 1 ? 'bg-green-500' : 'bg-purple-500 animate-pulse'}`}></span>
                      准备中...
                    </p>
                  )}
                  {processingStep >= 2 && (
                    <p className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${processingStep > 2 ? 'bg-green-500' : 'bg-purple-500 animate-pulse'}`}></span>
                      压缩图片...
                    </p>
                  )}
                  {processingStep >= 3 && (
                    <p className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${processingStep > 3 ? 'bg-green-500' : 'bg-purple-500 animate-pulse'}`}></span>
                      调用 AI 处理...（可能需要几秒）
                    </p>
                  )}
                  {processingStep >= 4 && (
                    <p className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full bg-purple-500 animate-pulse`}></span>
                      生成结果...
                    </p>
                  )}
                </div>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-4">
                  提示：图片越大处理越慢，已启用30秒超时保护
                </p>
              </div>
            )}

            {/* 错误提示 */}
            {error && !isProcessing && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-2">
                    处理失败
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                    {error}
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleRetry}
                    className="px-8 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    重试
                  </button>
                  <button
                    onClick={handleBack}
                    className="px-8 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    返回首页
                  </button>
                </div>
              </div>
            )}

            {/* 成功结果 */}
            {!isProcessing && !error && processedImage && originalImage && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                    处理完成！
                  </h2>

                  {/* 图片对比 */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* 原图 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        原始图片
                      </h3>
                      <div className="relative group">
                        {/* 棋盘格背景，用于显示透明度 */}
                        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+AAAAABJRU5ErkJggg==')] bg-[length:20px_20px] bg-repeat opacity-50 rounded-xl"></div>
                        <img
                          src={originalImage}
                          alt="原始图片"
                          className="relative w-full h-auto rounded-xl shadow-md"
                        />
                      </div>
                    </div>

                    {/* 处理后 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        背景移除后
                      </h3>
                      <div className="relative group">
                        {/* 棋盘格背景，用于显示透明度 */}
                        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+AAAAABJRU5ErkJggg==')] bg-[length:20px_20px] bg-repeat opacity-50 rounded-xl"></div>
                        <img
                          src={processedImage}
                          alt="背景移除后"
                          className="relative w-full h-auto rounded-xl shadow-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 操作提示 */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        背景已成功移除！您可以下载透明背景的PNG图片，或者重新上传其他图片。
                      </p>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={handleDownload}
                      className="px-8 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      下载 PNG
                    </button>
                    <button
                      onClick={handleRetry}
                      className="px-8 py-3 rounded-xl font-medium text-white bg-gray-600 hover:bg-gray-700 transition-colors"
                    >
                      重新处理
                    </button>
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      上传新图片
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* 页脚 */}
        <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Powered by Remove.bg API</p>
        </footer>
      </div>
    </div>
  );
}

// 页面组件，用 Suspense 包裹 ResultContent
export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">加载中...</p>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
