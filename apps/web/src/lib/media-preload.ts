/**
 * 媒体资源预加载工具：提前加载图片和音频，减少 AVG 模式场景切换时的等待感。
 * T2.6 资源懒加载基础设施。
 */

/**
 * 预加载图片资源。返回 Promise，在图片加载完成或失败时 resolve/reject。
 * 可在 AVG 引擎切换节点时提前调用，预加载下一场景的背景图。
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;
  });
}

/**
 * 预加载音频资源。返回 Promise，在音频可播放时 resolve。
 */
export function preloadAudio(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => resolve();
    audio.onerror = () => reject(new Error(`Failed to preload audio: ${src}`));
    audio.src = src;
  });
}
