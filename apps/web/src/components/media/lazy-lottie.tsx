/**
 * 懒加载 Lottie 动画包装组件。
 * 使用 next/dynamic 动态导入 lottie-react，确保 ~150KB 的 Lottie 库不影响首屏 JS bundle。
 * T2.6 资源懒加载基础设施。
 */
'use client';

import dynamic from 'next/dynamic';

const LottiePlayer = dynamic(() => import('lottie-react'), {
  ssr: false,
  loading: () => null,
});

type LazyLottieProps = {
  /** Lottie 动画 JSON 数据 */
  animationData: unknown;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
};

export function LazyLottie({
  animationData,
  loop = true,
  autoplay = true,
  className,
}: LazyLottieProps) {
  return (
    <LottiePlayer
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
    />
  );
}
