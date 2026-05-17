# 语音彩蛋静态资源（T4.3）

## 命名规则

- 每个 MBTI 四字母类型对应一个文件：`{MBTI}.mp3`（大写），例如 `INFP.mp3`。
- 前端通过 `buildVoiceAudioUrl(type)` 解析为 `/audio/voice/INFP.mp3`。

## 替换流程

1. 由运营/配音提供 ≤500KB/文件的 MP3（16 型合计建议 ≤8MB）。
2. 覆盖本目录下同名文件，保持文件名与类型一致。
3. 本地 `pnpm dev:web` 访问 `/voice/{TYPE}?from=poster` 点击播放验收。

## MVP 占位

- 运行 `node scripts/generate-voice-placeholders.cjs` 生成 16 个 `{MBTI}.mp3`（内嵌约 0.7s、880Hz 提示音 WAV 数据，便于扫码验收时「能听到播放」）。
- 上线前请用真实预录制 **MP3** 配音覆盖同名文件。
