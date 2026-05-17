/**
 * 海报精灵称号：与 sprite-profile-card 规则一致（T4.2）。
 */

/**
 * @param mbtiType MBTI 四字母类型
 */
export function pickSpriteLabel(mbtiType: string): string {
  const first = mbtiType.toUpperCase()[0];
  if (first === 'E') return '曦光领航精灵';
  if (first === 'I') return '月影探索精灵';
  return '星环守护精灵';
}
