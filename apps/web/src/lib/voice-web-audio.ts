/**
 * 语音彩蛋 Web Audio 播放引擎（T4.3）：fetch → decodeAudioData → BufferSource。
 */

/** 音频加载或解码失败 */
export class VoiceAudioLoadError extends Error {
  constructor(
    message: string,
    public readonly url: string,
  ) {
    super(message);
    this.name = 'VoiceAudioLoadError';
  }
}

export type VoiceWebAudioEngine = {
  resume(): Promise<void>;
  loadBuffer(url: string): Promise<AudioBuffer>;
  play(buffer: AudioBuffer): void;
  stop(): void;
  loadAndPlay(url: string): Promise<void>;
  dispose(): void;
};

type AudioContextFactory = () => AudioContext;

function resolveAudioContextFactory(factory?: AudioContextFactory): AudioContextFactory {
  if (factory) return factory;
  return () => {
    const Ctor =
      typeof window !== 'undefined'
        ? (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined;
    if (!Ctor) {
      throw new Error('当前浏览器不支持 Web Audio API');
    }
    return new Ctor();
  };
}

/**
 * 创建可复用的 Web Audio 引擎；页面卸载时须调用 dispose。
 */
export function createVoiceWebAudioEngine(
  audioContextFactory?: AudioContextFactory,
): VoiceWebAudioEngine {
  const createContext = resolveAudioContextFactory(audioContextFactory);
  let context: AudioContext | null = null;
  let activeSource: AudioBufferSourceNode | null = null;

  const getContext = (): AudioContext => {
    if (!context) context = createContext();
    return context;
  };

  return {
    async resume() {
      const ctx = getContext();
      if (ctx.state === 'suspended') await ctx.resume();
    },

    async loadBuffer(url: string) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new VoiceAudioLoadError(`无法加载语音资源（HTTP ${response.status}）`, url);
      }
      const arrayBuffer = await response.arrayBuffer();
      const ctx = getContext();
      try {
        return await ctx.decodeAudioData(arrayBuffer);
      } catch {
        throw new VoiceAudioLoadError('音频解码失败', url);
      }
    },

    play(buffer: AudioBuffer) {
      const ctx = getContext();
      if (activeSource) {
        try {
          activeSource.stop();
        } catch {
          /* 已结束 */
        }
        activeSource.disconnect();
        activeSource = null;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        if (activeSource === source) activeSource = null;
      };
      source.start(0);
      activeSource = source;
    },

    stop() {
      if (!activeSource) return;
      try {
        activeSource.stop();
      } catch {
        /* 已结束 */
      }
      activeSource.disconnect();
      activeSource = null;
    },

    async loadAndPlay(url: string) {
      await this.resume();
      const buffer = await this.loadBuffer(url);
      this.play(buffer);
    },

    dispose() {
      this.stop();
      if (context) {
        void context.close();
        context = null;
      }
    },
  };
}
