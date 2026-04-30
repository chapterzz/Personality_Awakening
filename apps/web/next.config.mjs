/**
 * Next.js 构建与运行时配置。
 * 开发态下适当放宽 chunk 加载超时，减轻 Windows/杀软扫描盘符时偶发的 `ChunkLoadError: app/layout` timeout。
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  /** 图片优化配置：本地 public/ 资源自动优化，CDN 域名在此预留 */
  images: {
    remotePatterns: [
      // CDN 域名上线时取消注释并填写实际域名
      // { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer && config.output) {
      config.output.chunkLoadTimeout = 300000;
    }
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        ignored: [
          ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
          // Windows: watchpack/webpack 的 ignored 在 Next 校验下必须是字符串 glob
          '**/System Volume Information/**',
          '**\\\\System Volume Information\\\\**',
          'D:/System Volume Information/**',
          'D:\\\\System Volume Information\\\\**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
