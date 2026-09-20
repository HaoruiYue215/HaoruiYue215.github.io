export const person = {
  nameZh: "岳好睿",
  nameEn: "Haorui Yue",
  role: "AI 产品经理",
  email: "1051989207@qq.com",
  phone: "+86 173 9293 6581",
  github: "https://github.com/HaoruiYue215",
  resume: "/yue-haorui-resume.pdf",
  site: "https://haoruiyue215.github.io",
};

export const nav = [
  { href: "#work", label: "精选工作" },
  { href: "#about", label: "关于" },
  { href: "#skills", label: "技能" },
  { href: "#contact", label: "发邮件" },
] as const;

export const works = [
  {
    id: "nano",
    company: "360",
    unit: "智能体业务部",
    role: "AI 产品经理",
    dates: "2026.03-2026.06",
    title: "纳米 AI 智能体广场",
    body: "从 0 到 1 设计广场、内容展示和创建配置。搭上架链路，推动 50 个智能体工作流上线。",
    points: [
      "筛选、验证、打包、上架全链路，含撤销重做与上下架状态。",
      "Chat 页信息层级加对话引导，首次对话成功率提高 30%。",
      "创建配置沉淀 5 类任务场景，并优化 Skill 与 MCP 调度。",
    ],
    stats: [
      { value: "50", label: "智能体上架" },
      { value: "+30%", label: "首次对话成功率" },
      { value: "5", label: "任务场景" },
    ],
    image: "/images/work-nano.jpg",
    imageAlt: "夜晚产品工作室，屏幕发出冷光",
  },
  {
    id: "lalamove",
    company: "货拉拉",
    unit: "平台交易部",
    role: "产品经理",
    dates: "2025.09-2025.12",
    title: "拼车预约与方舟后台",
    body: "改下单页预约组件，重做方舟后台。拼车不再走即时单，司机压力下降，配对效率提高 7%。",
    points: [
      "调研定位中长途拼车响应低，关闭即时下单选项。",
      "独立设计前后台，按城市、车型、时间配置策略。",
      "订单规模稳定，并留下可复用的 AB 实验机制。",
    ],
    stats: [
      { value: "+7%", label: "配对效率" },
      { value: "3", label: "策略维度" },
    ],
    image: "/images/work-lalamove.jpg",
    imageAlt: "夜间城市货运装卸区",
  },
  {
    id: "youdao",
    company: "网易有道",
    unit: "升学中心部",
    role: "AI 产品经理",
    dates: "2025.06-2025.08",
    title: "作文批改 Agent",
    body: "B2C 中文作文批改。大模型加人工规则，补上传统批改慢、反馈晚、指导粗的缺口。",
    points: [
      "梳理上传、纠错、AI 批改、教师复核、报告全流程。",
      "一档至五档，基准分加亮点、减扣分，覆盖偏题与残篇。",
      "内测对照人工评分，定档准确率 91.23%，一档二档 100%。",
    ],
    stats: [
      { value: "91.23%", label: "定档准确率" },
      { value: "100%", label: "一档二档准确率" },
      { value: "87.72%", label: "总分合格率" },
    ],
    image: "/images/work-youdao.jpg",
    imageAlt: "书桌上的作文卷和红笔批注",
  },
  {
    id: "red",
    company: "小红书",
    unit: "交易部",
    role: "产品经理",
    dates: "2024.12-2025.03",
    title: "直播拼手气红包",
    body: "给带货主播加上可配置的拼手气红包。上线后看播时长提高 27%，主播 GMV 提高 8%。",
    points: [
      "固定金额红包互动弱，改为实时可玩的分配。",
      "主播可在 PC 和移动端配名称、金额、条件和期限。",
      "一个月内带前后端、测试、UI、数开上线。",
    ],
    stats: [
      { value: "+27%", label: "看播时长" },
      { value: "+8%", label: "主播 GMV" },
    ],
    image: "/images/work-red.jpg",
    imageAlt: "空置的直播灯光现场",
  },
] as const;

export const education = [
  {
    school: "香港大学",
    schoolEn: "The University of Hong Kong",
    program: "地理空间数据科学",
    dates: "2025.09-2026.11",
  },
  {
    school: "西安建筑科技大学",
    schoolEn: "Xi'an University of Architecture and Technology",
    program: "建筑学  GPA 3.52 / 5.0",
    dates: "2020.09-2025.06",
  },
] as const;

export const skills = [
  {
    id: "product",
    title: "产品",
    body: "用 SQL 和 Python 处理数据。用 Axure 和 Figma 画原型，把调研写成可开发的流程。",
    image: "/images/work-nano.jpg",
    imageAlt: "产品工作台",
    span: "md:col-span-7 md:row-span-2",
    tall: true,
  },
  {
    id: "ops",
    title: "运营",
    body: "小红书、抖音、Facebook、TikTok。Adobe 做图和视频。",
    span: "md:col-span-5",
  },
  {
    id: "lang",
    title: "语言",
    body: "英语听说读写，雅思 7.0。硕士英文授课。中文母语。",
    span: "md:col-span-5",
    accent: true,
  },
  {
    id: "ai",
    title: "AI",
    body: "Cursor、DeepSeek、Midjourney、Stable Diffusion、Seedance、Lib TV。用 Codex 搭过可验证 demo。",
    span: "md:col-span-6",
  },
  {
    id: "arch",
    title: "建筑",
    body: "五年建筑设计。习惯先读约束和结构，再决定界面怎么长。",
    image: "/images/about-model.jpg",
    imageAlt: "四合院体块模型",
    span: "md:col-span-6",
  },
] as const;

export const studio = {
  title: "苏小白",
  handle: "@苏小白",
  body: "美妆新手和淡颜向账号。自己做选题、竞品、数据和社群。笔记 100+，粉丝 3W+。",
  stats: [
    { value: "2.9M", label: "获赞与收藏" },
    { value: "30W+", label: "单篇最高观看" },
    { value: "92.4%", label: "活跃粉丝占比" },
  ],
  image: "/images/ip-studio.jpg",
  imageAlt: "日光下的化妆台",
};
