import type { SkillGuide } from "./types";

export const agentsGuide: SkillGuide = {
  scenarios: [
    {
      title: "智能体辅助开发",
      flow: "明确需求和验收标准，让 Agent 阅读仓库并拆分任务，结合项目规则、Skills 与 MCP 完成实现；随后运行检查、审查代码差异和关键边界，整理为可验证的提交。",
      skills: ["plans", "debug", "tdd"],
      tools: ["Codex","Claude Code","Cursor"],
    },
    {
      title: "企业知识与业务助手",
      flow: "整理业务资料和访问权限，建立检索与引用流程，再连接查询、分类等业务工具；用真实问题检验回答和执行结果，持续更新知识，形成可追溯的内部助手。",
      skills: ["mcp", "creator"],
      tools: ["Dify","n8n"],
    },
    {
      title: "影刀 RPA 与桌面流程",
      flow: "梳理人工操作后，用影刀串起网页、桌面软件和表格处理，结合 AI 完成文本理解与信息提取，再加入业务编号去重、异常重试和定时运行，实现跨系统录入与报表自动化。",
      skills: ["spreadsheet", "creator"],
      tools: ["影刀 RPA / 影刀 AI"],
    },
    {
      title: "跨系统流程与定时任务",
      flow: "以事件或计划触发流程，获取并整理数据后调用模型和业务 API，按条件分发结果、写入系统并发送通知；为超时、重复事件和部分失败设置恢复路径，保留运行记录。",
      skills: ["n8n", "n8nErrors"],
      tools: ["n8n","Dify"],
    },
    {
      title: "浏览器任务与信息采集",
      flow: "按目标字段组织网页访问、分页和下载，用 Playwright 或浏览器 Agent 提取数据，再完成清洗、去重和数量校验；保留来源与采集时间，异常页面支持复查和继续处理。",
      skills: ["browser", "webTesting", "spreadsheet"],
      tools: ["Playwright / Browser Use","影刀 RPA / 影刀 AI"],
    },
    {
      title: "可复用 Skills 与 Agent 工程",
      flow: "将重复任务整理成明确的输入、步骤和成果，编写 Skills 与辅助脚本，通过 MCP 连接外部工具，再设置权限和人工确认环节，用样例持续检验执行效果并改进。",
      skills: ["creator", "mcp", "plans", "n8nErrors"],
      tools: ["Claude Code","Codex","n8n"],
    },
  ],
  tools: [
    {"name":"Codex","href":"https://learn.chatgpt.com/docs/cloud"},
    {"name":"Claude Code","href":"https://code.claude.com/docs/en/overview"},
    {"name":"Cursor","href":"https://cursor.com/docs/agent/overview"},
    {"name":"影刀 RPA / 影刀 AI","href":"https://www.yingdao.com/ai"},
    {"name":"n8n","href":"https://n8n.io/"},
    {"name":"Dify","href":"https://docs.dify.ai/en/home"},
    {"name":"Playwright / Browser Use","href":"https://github.com/browser-use/browser-use"},
  ],
};
