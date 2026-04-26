/**
 * 结果页文案映射：16 型人格对应标题、描述与建议（前端本地静态版本）。
 */
export type MbtiType =
  | 'INTJ'
  | 'INTP'
  | 'ENTJ'
  | 'ENTP'
  | 'INFJ'
  | 'INFP'
  | 'ENFJ'
  | 'ENFP'
  | 'ISTJ'
  | 'ISFJ'
  | 'ESTJ'
  | 'ESFJ'
  | 'ISTP'
  | 'ISFP'
  | 'ESTP'
  | 'ESFP';

export type MbtiCopy = {
  title: string;
  summary: string;
  strengths: string[];
  suggestions: string[];
};

const createCopy = (type: MbtiType, summary: string): MbtiCopy => ({
  title: `${type} 星球档案`,
  summary,
  strengths: ['你有独特的认知优势', '在熟悉情境中决策效率高', '能为团队提供稳定价值'],
  suggestions: ['先觉察自己的能量来源', '遇到冲突时多表达真实需求', '把优势转化为可执行小目标'],
});

export const MBTI_COPY: Record<MbtiType, MbtiCopy> = {
  INTJ: createCopy('INTJ', '擅长战略思考，喜欢独立规划长期目标。'),
  INTP: createCopy('INTP', '重视逻辑与模型，热衷探索新观点。'),
  ENTJ: createCopy('ENTJ', '目标导向明确，善于推动事情落地。'),
  ENTP: createCopy('ENTP', '创意活跃，擅长从多角度寻找突破口。'),
  INFJ: createCopy('INFJ', '洞察细腻，关注价值与长期意义。'),
  INFP: createCopy('INFP', '重视内在价值，表达真诚且富有同理心。'),
  ENFJ: createCopy('ENFJ', '擅长组织协作，能激发他人潜力。'),
  ENFP: createCopy('ENFP', '热情开放，能把想法转成积极行动。'),
  ISTJ: createCopy('ISTJ', '稳健务实，做事重流程与可靠性。'),
  ISFJ: createCopy('ISFJ', '细致体贴，愿意持续支持团队。'),
  ESTJ: createCopy('ESTJ', '执行力强，善于建立规则与秩序。'),
  ESFJ: createCopy('ESFJ', '重视协同氛围，沟通与落实并重。'),
  ISTP: createCopy('ISTP', '动手能力强，擅长快速定位问题。'),
  ISFP: createCopy('ISFP', '审美敏感，偏好自由且真实的表达。'),
  ESTP: createCopy('ESTP', '反应灵活，能在变化中迅速决策。'),
  ESFP: createCopy('ESFP', '感染力强，擅长让团队保持活力。'),
};

export function getMbtiCopy(type: string): MbtiCopy {
  const key = type.toUpperCase() as MbtiType;
  return MBTI_COPY[key] ?? createCopy('INFP', '正在同步你的类型解读，请稍后重试。');
}
