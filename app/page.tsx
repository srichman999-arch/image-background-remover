'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  // 压缩图片函数
  const compressImage = (file: File, maxWidth = 1920, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('无法创建 canvas 上下文'));
            return;
          }

          // 计算压缩后的尺寸
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          // 绘制并压缩
          ctx.drawImage(img, 0, 0, width, height);

          // 导出为 base64
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'image/jpeg' || file.type === 'image/png';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 放宽到10MB限制

      if (!isValidType) {
        alert('只支持 JPG 和 PNG 格式的图片');
        return false;
      }

      if (!isValidSize) {
        alert('图片大小不能超过 10MB');
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      const file = validFiles[0];
      setSelectedFile(file);

      try {
        // 压缩图片
        const compressedDataUrl = await compressImage(file);
        setPreview(compressedDataUrl);
      } catch (error) {
        console.error('压缩失败:', error);
        // 如果压缩失败，直接使用原图
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // 将文件转换为base64存储到sessionStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // 存储标记，确保数据已准备好
        sessionStorage.setItem('imageReady', 'true');
        // 存储图片数据
        sessionStorage.setItem('originalImage', base64);
        // 使用 setTimeout 确保存储完成后再跳转
        setTimeout(() => {
          router.push('/result');
        }, 100);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            图片背景移除工具
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            快速去除图片背景，生成透明背景的PNG图片
          </p>
        </header>

        {/* 主要内容 */}
        <main className="max-w-3xl mx-auto">
          {!selectedFile ? (
            // 上传区域
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer
                transition-all duration-300 ease-in-out
                ${isDragging
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105'
                  : 'border-gray-300 hover:border-purple-400 bg-white dark:bg-gray-800 hover:scale-102'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* 图标 */}
              <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              {/* 文字 */}
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                  {isDragging ? '松开鼠标上传' : '拖拽图片到这里'}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  或者 <span className="text-purple-600 dark:text-purple-400 font-medium">点击选择</span> 文件
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">
                  支持 JPG、PNG 格式，最大 10MB（自动压缩优化）
                </p>
              </div>
            </div>
          ) : (
            // 预览区域
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                  图片预览
                </h2>

                {/* 图片预览 */}
                {preview && (
                  <div className="relative mx-auto max-w-lg">
                    <img
                      src={preview}
                      alt="预览"
                      className="w-full h-auto rounded-2xl shadow-md"
                    />
                  </div>
                )}

                {/* 文件信息 */}
                <div className="mt-6 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{selectedFile.name}</span>
                  </div>
                  <div>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="mt-8 flex gap-4 justify-center">
                  <button
                    onClick={handleReset}
                    className="px-8 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    重新选择
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-8 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        处理中...
                      </span>
                    ) : (
                      '开始处理'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 页脚 */}
        <footer className="mt-16 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Powered by Remove.bg API</p>
        </footer>
      </div>
    </div>
  );
}
