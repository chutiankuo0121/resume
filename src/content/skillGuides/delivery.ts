import type { SkillGuide } from "./types";

export const deliveryGuide: SkillGuide = {
  scenarios: [
    {
      title: "网站发布与边缘服务",
      flow: "根据静态页面、动态渲染和后端任务选择部署平台，配置构建、环境变量、域名与 HTTPS，再验证缓存、接口和错误页，完成预览与生产发布并保留版本回退入口。",
      skills: ["cf", "cfDeploy", "vercelDeploy", "workers", "wrangler"],
      tools: ["Cloudflare","Vercel"],
    },
    {
      title: "服务器与容器运行",
      flow: "准备 Linux、网络与访问权限，用 Docker 或 systemd 管理服务，再配置反向代理、证书和持久化存储；接入日志与健康检查，验证重启后进程和任务能够恢复。",
      skills: ["plans", "debug", "security"],
      tools: ["Linux / systemd / Nginx","Docker / Kubernetes / Terraform"],
    },
    {
      title: "GitHub 与持续交付",
      flow: "通过分支和 PR 组织改动，自动执行测试、类型检查与构建，生成预览供评审后再发布正式版本；分别管理环境配置，记录发布结果，并在失败时中止或回滚。",
      skills: ["ci", "vercelDeploy", "cfDeploy"],
      tools: ["GitHub / GitHub Actions","GitLab CI/CD","Vercel"],
    },
    {
      title: "云数据库、存储与后台任务",
      flow: "按关系数据、缓存、文件和事件选择云服务，配置连接与权限后接入应用，再组织任务调度、迁移和备份，处理重复消息与更新一致性，持续观察容量和运行成本。",
      skills: ["postgres", "cf", "workers", "durable"],
      tools: ["Supabase / Turso / Redis","Cloudflare"],
    },
    {
      title: "监控、排障与恢复",
      flow: "将应用日志、错误和请求追踪关联到具体服务与版本，通过告警定位异常后复现原因，选择修复或回滚，再验证业务恢复和备份可用性，整理可重复执行的处置步骤。",
      skills: ["sentry", "debug", "perf"],
      tools: ["Sentry / OpenTelemetry / Prometheus / Grafana","Linux / systemd / Nginx"],
    },
    {
      title: "基础设施与规模化运维",
      flow: "用配置定义资源并区分开发、测试和生产环境，组织容器、网络、密钥与负载均衡；依据运行指标调整容量，验证扩容、迁移和故障恢复步骤，保持环境可重复交付。",
      skills: ["plans", "security", "cf"],
      tools: ["Docker / Kubernetes / Terraform","Cloudflare"],
    },
  ],
  tools: [
    {"name":"Cloudflare","href":"https://developers.cloudflare.com/workers/"},
    {"name":"Vercel","href":"https://vercel.com/docs/deployments"},
    {"name":"GitHub / GitHub Actions","href":"https://docs.github.com/en/actions/get-started/understand-github-actions"},
    {"name":"GitLab CI/CD","href":"https://docs.gitlab.com/ci/"},
    {"name":"Linux / systemd / Nginx","href":"https://nginx.org/en/docs/"},
    {"name":"Docker / Kubernetes / Terraform","href":"https://docs.docker.com/"},
    {"name":"Supabase / Turso / Redis","href":"https://supabase.com/docs"},
    {"name":"Sentry / OpenTelemetry / Prometheus / Grafana","href":"https://opentelemetry.io/docs/"},
  ],
};
