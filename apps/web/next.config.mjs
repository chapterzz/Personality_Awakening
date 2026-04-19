/**
 * Next.js 构建与运行时配置。
 * 开发态下适当放宽 chunk 加载超时，减轻 Windows/杀软扫描盘符时偶发的 `ChunkLoadError: app/layout` timeout。
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer && config.output) {
      config.output.chunkLoadTimeout = 300000;
    }
    return config;
  },
};

export default nextConfig;
