/**
 * 装饰性浮动 blob 组件：半透明彩色圆形，带模糊和慢速浮动动画。
 * 纯装饰性，pointer-events-none 不影响交互。
 */
export function FloatingBlobs({ variant = 'default' }: { variant?: 'default' | 'light' }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl animate-blob-float" />
      <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-[#A78BFA]/10 blur-3xl animate-blob-float-alt" />
      {variant !== 'light' && (
        <div className="absolute right-1/4 top-1/3 h-24 w-24 rounded-full bg-accent/8 blur-2xl animate-blob-float" />
      )}
    </div>
  );
}
