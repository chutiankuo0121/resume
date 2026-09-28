import type { SkillGuide } from "./types";

export const voiceGuide: SkillGuide = {
  scenarios: [
    {
      title: "AI 音乐与影视配乐",
      flow: "根据片长和画面情绪确定曲风、歌词与段落，生成多个方向试听，再按剪辑节奏调整速度和进出点，完成分轨编辑、混音与响度统一，输出完整配乐及不同时长的版本。",
      skills: ["music", "sfx"],
      tools: ["Suno v6 / Studio 2.0","Eleven Music v2.5","FFmpeg / REAPER"],
    },
    {
      title: "短剧、漫剧与角色配音",
      flow: "按角色拆解剧本，确定音色、读音和情绪后分段生成对白，再对齐镜头与字幕，修订发音和语气衔接，补入环境声与音效，合成为完整的配音版本。",
      skills: ["tts", "changer", "sfx"],
      tools: ["ElevenLabs · Eleven v3 / Dubbing v2","Fish Audio · S2.1 Pro","豆包语音"],
    },
    {
      title: "口播、有声书与无障碍朗读",
      flow: "整理文稿和专有词读音，按语义分段并设定音色、语速，批量生成后逐段校听，修正问题句并统一音量，按章节或发布场景导出旁白、口播与有声内容。",
      skills: ["speech", "tts"],
      tools: ["Qwen3-TTS","豆包语音","OpenAI · GPT-Live / Audio API"],
    },
    {
      title: "语音转文字与字幕制作",
      flow: "先清理录音，再识别语言和说话人，生成带时间戳的文字稿；校订术语、数字与重叠对白后完成字幕断句和时间轴对齐，输出逐字稿、字幕，或进一步整理会议纪要。",
      skills: ["transcribe", "stt", "isolation"],
      tools: ["Scribe v2 / Scribe v2 Realtime","Qwen3-ASR","OpenAI · GPT-Live / Audio API"],
    },
    {
      title: "跨语言译配与内容本地化",
      flow: "识别原音和角色，将内容翻译为自然的目标语言表达，再按镜头时长调整句子并生成配音，校对发音与情绪后回混音乐、音效，交付多语言音轨和字幕。",
      skills: ["dubbing", "stt", "tts"],
      tools: ["ElevenLabs · Eleven v3 / Dubbing v2","Fish Audio · S2.1 Pro","FFmpeg / REAPER"],
    },
    {
      title: "实时语音助手与交互角色",
      flow: "接入麦克风和实时语音识别，将用户问题交给知识检索与业务工具处理，再以流式语音回应；同时处理打断、超时和会话恢复，形成可嵌入网页的语音交互入口。",
      skills: ["voiceAgent", "speechEngine", "mcp"],
      tools: ["OpenAI · GPT-Live / Audio API","豆包语音","Scribe v2 / Scribe v2 Realtime"],
    },
    {
      title: "音频修复、音效与批量交付",
      flow: "从原始音频中清理噪声、提取对白并修整接缝，按画面补充音效，完成均衡、混音和响度统一；批量任务通过队列处理，校验音画同步后转码、命名并归档。",
      skills: ["isolation", "sfx", "changer", "n8n"],
      tools: ["FFmpeg / REAPER","ElevenLabs · Eleven v3 / Dubbing v2"],
    },
  ],
  tools: [
    {"name":"Suno v6 / Studio 2.0","href":"https://www.suno.com/release-notes"},
    {"name":"Eleven Music v2.5","href":"https://elevenlabs.io/docs/eleven-creative/products/music"},
    {"name":"FFmpeg / REAPER","href":"https://www.reaper.fm/"},
    {"name":"ElevenLabs · Eleven v3 / Dubbing v2","href":"https://elevenlabs.io/docs/overview/models"},
    {"name":"Fish Audio · S2.1 Pro","href":"https://fish.audio/blog/s2-1-pro-free-api/"},
    {"name":"豆包语音","href":"https://docs.volcengine.com/docs/DoubaoVoice/Productdynamics?lang=zh"},
    {"name":"Qwen3-TTS","href":"https://github.com/QwenLM/Qwen3-TTS"},
    {"name":"Scribe v2 / Scribe v2 Realtime","href":"https://elevenlabs.io/docs/overview/models"},
    {"name":"OpenAI · GPT-Live / Audio API","href":"https://developers.openai.com/api/docs/guides/audio"},
    {"name":"Qwen3-ASR","href":"https://github.com/QwenLM/Qwen3-ASR"},
  ],
};
