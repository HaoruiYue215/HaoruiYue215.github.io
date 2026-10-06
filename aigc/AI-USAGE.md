# AI 工具使用说明

**声纹 SOUNDPRINT · 音乐节 AIGC 海报工位**。按题目要求分三块：使用的工具 / 关键提示词 / 本人完成的主要修改。原则：两层都写清楚，人的判断单独列，不装成手写了全部代码。

## 1. 使用的工具

| 工具 | 用在哪 | 说明 |
|---|---|---|
| Cursor | 策划与实现 | 产品方向、方案页（proposal.html）与可运行原型（工位 / 大屏 / 分享页）的代码都在本项目对话里由 Cursor 生成，本人逐步确认、验收、改方向 |
| Pollinations（image.pollinations.ai） | 现场图生图 | 免 Key 公开生图接口，保证 zip 打开就能演示，不需要任何付费账号 |
| qrcode-generator 1.4.4（Kazuhiko Arase，MIT） | 海报二维码 | 已 vendor 进 `js/vendor/qrcode.js`，打进文件夹、离线可用，无运行时外部依赖 |
| 公开案例页 | 参考检索 | Breeze Selfie Wall、Snapbar、Rhode×818、MAC 阿那亚、曼妥思×听潮阁、可口可乐 Create Real Magic 等，方案页附全部链接 |

**诚实说明：生图链路的真实现状（2026-10 复测）。** 计划写的是 Pollinations `kontext` 图生图；上游已把 kontext 在内的**全部**图生图模型迁到 gen.pollinations.ai 新网关（需 enter.pollinations.ai 注册 Key，匿名一律 401；旧端点 kontext 直连稳定 500）。匿名层如今只剩 `sana` 一个模型（DreamShaper 8 LCM，**纯文生图**）：传任何其它 model 都被静默降级成 sana，`image` 参数被完全无视（实测：68% 红色测试图输入，输出红色占比 0%）。**匿名接口已做不到真正的图生图。** 因此实际链路是，全部真实请求，失败明确报错、可重试，绝不用预设假图冒充成功：

1. **kontext 直连（试 1 次）** —— 真正保留五官身份的 img2img；匿名 500 属预期（约 0.5 秒快速失败），部署环境若配了 Key / referrer 提权即可用；
2. **匿名默认模型直连** —— 产出音乐节氛围场景（不含本人）；匿名层限流明显（402 / 5xx 随机出现），带指数退避自动重试；
3. **默认模型经 images.weserv.nl 图片代理** —— localhost 演示时浏览器 Origin 会被上游 403，代理服务端取图可绕过，且回包带 CORS 头；
4. **照片驱动合成（Canvas）** —— 第 2/3 级的成片不含本人时，把自拍本体铺满打底、按所选风格做像素级调色（胶片 / 霓虹 / 酸性 / 水墨），AI 场景以 screen 混合叠入作氛围（灯光 / 霓虹浮到照片上），再加颗粒统一质感。海报里的人是**本人照片**，身份 100% 保真；AI 负责氛围。这是匿名条件下「照片驱动生成」的诚实实现，不伪装成模型图生图。

自拍是本地画面，图生图接口要公网 URL：生成前经短时图床中转（0x0.st → transfer.sh → litterbox.catbox.moe 三家依次尝试），用完即弃；原自拍不上墙、不进分享页。

不写进交付：付费生图 Key、Midjourney 账号、需登录才能跑的服务。

## 2. 关键提示词

### 2.1 工位生图提示词（定稿 v3，原样摘自 `js/poster.js`）

编辑指令式固定骨架 + 变量（人格 / 风格 / 用户那句话 / 对应耳机款），负面约束追加在末尾。v3 把「保留身份」从一句愿望改成明确的**编辑指令**（改这张图，只换风格 / 背景 / 光线），图生图模型可用时身份保留显著更强：

```
edit this exact photo of the person, keep their face, pose, clothing and identity unchanged, transform only the style, background and lighting into a {style.prompt} {persona.en} music festival poster, they are wearing SOUNDPRINT {persona.skuEn} headphones, {mood}, no nudity, no suggestive content, no violence, no blood, no weapons, no politician, no political symbols, no competitor logos, no brand marks, no extra text, no captions, no watermark
```

变量表：

- `{style.prompt}`：`film grain analog photo` / `cyberpunk neon` / `acid graphics poster` / `ink wash dreamcore`
- `{persona.en}`：`pop` / `electronic` / `rock` / `folk`
- `{persona.skuEn}`：`warm-gold` / `neon-bass` / `live-distortion` / `vocal-forward`
- `{mood}`：用户留话时为 `mood from "{line}"`（截断 60 字符、去掉引号换行，降低注入面）；留空时为 `euphoric festival mood`

负面约束按安全四层之 L3（生成约束）分五类挡输出越界：`no nudity, no suggestive content`（色情）、`no violence, no blood, no weapons`（暴恐）、`no politician, no political symbols`（涉政）、`no competitor logos, no brand marks`（竞品，品牌一律后叠、不让模型画）、`no extra text, no captions, no watermark`（文字乱入，文案全部由 Canvas 叠）。

一条真实拼出的提示词（电子 × 赛博霓虹，用户留话「今晚的风都是低频」）：

```
edit this exact photo of the person, keep their face, pose, clothing and identity unchanged, transform only the style, background and lighting into a cyberpunk neon electronic music festival poster, they are wearing SOUNDPRINT neon-bass headphones, mood from "今晚的风都是低频", no nudity, no suggestive content, no violence, no blood, no weapons, no politician, no political symbols, no competitor logos, no brand marks, no extra text, no captions, no watermark
```

演进记录：v1（Step 2）结尾只有 `no extra text, no watermark` 两条；v2（Step 4）补全五类负面约束定稿；v3 改为编辑指令式骨架（`edit this exact photo … transform only the style, background and lighting`），配合照片驱动合成兜底。品牌元素（Logo / 称号 / 声纹编号 / 二维码）一律 Canvas 后叠，模型自由发挥也不动品牌锁相。

### 2.2 产品协作指令（节选）

用来锁定方向的指令，节选三条，括号内是人的改法：

- **玩法锁定**：「没有付费 Key，走免 Key 公开生图接口；独立文件夹交付，最后打 zip 上传；音乐人格按曲风：流行 / 电子 / 摇滚 / 民谣；大屏高潮：先一张全屏揭晓，再落入九宫格墙；现场硬件：一台拍照机器 + 一块大屏；生成效果：Snapbar 式真人出镜的音乐节主题海报，不是纯文生图。」（AI 曾建议做心理测试人格和线上传图，人砍掉：人格改自选曲风，人脸只由现场工位拍摄。）
- **转化三方案**：「转化对照三个案例做成三套可并列展示的方案，各出一张示意图：Rhode 当场拿走 / MAC 社交加码 / 曼妥思人设对货盘；工位主流程仍是拍照出图上墙，转化发生在出图之后，不做成三条互斥关卡。」（AI 初版把转化收成「Logo + 一句试听」，人打回重做。）
- **安全四层**：「先审后生成、先审后上墙，拿不准就关死：1 同意与人脸、2 输入文本、3 生成约束、4 上墙与带走；拦截就改、不占墙；不静默替换成星号再发出去。」（AI 曾提出敏感词打码后照常生成，人否掉：发出去的还是用户以为的那句，责任不清。）

## 3. 本人完成的主要修改

人的工作是产品判断和验收，不是假装没用 AI。

**已拍板的产品决策：**

- 曲风人格（流行 / 电子 / 摇滚 / 民谣）自选，不做心理测试；
- 大屏先全屏揭晓约 5 秒，再落入九宫格墙；
- Breeze 式「一台拍照机 + 一块大屏」现场形态，原型用全屏网页 + 第二个窗口模拟；
- Snapbar 式图生图：能认出是你，但已经是一张带活动气质的海报；不用纯文生图，不用滤镜贴纸；
- 转化三方案（Rhode 当场拿走 / MAC 社交加码 / 曼妥思人设对货盘）各一张示意图，不另做三条完整原型；
- 内容安全四层关死：先审后生成、先审后上墙；墙上只有成片，原自拍用完即弃；
- 四页柏林 techno 极简视觉：纯黑白灰、发丝线、方角、等宽编号、机械运动，不用彩色渐变。

**实现后逐条验收、改到能用为止的：**

- **词库与文案**：九类拦截词库（涉政 / 暴恐 / 色情 / 辱骂 / 歧视 / 竞品名 / 联系方式 / 链接 / 提示词注入，另留赌博毒品）每类的分类提示语定稿（如「包含联系方式，换一句吧 —— 海报会上公共大屏」）；7 个演示拦截词放进输入页角标供评审逐类点；修掉 `ig` 在 ignore 中误中联系方式正则的误报（英文短代号加词边界）。
- **海报构图**：1024×1280 竖版；顶部品牌行 + 右上等宽声纹编号，底部人格×风格小标、称号大字、用户原话、昵称、SKU + #我的声纹，右下真二维码；上下压暗渐变只为文案可读性，发丝边框收边。
- **占用时长常量**：会话总时长 90s、单步无操作 60s、锁心跳 3s、失联 10s 可接管、第二窗口轮询 2s、生成超时 150s；生成等待期间两个计时都暂停（占用方是机器不是用户）。
- **提示词定稿**：v1 → v2 补全五类负面约束；v3 改编辑指令式骨架。实测确认匿名层已无图生图（sana 纯文生图无视 `image` 参数，kontext 需 Key），因此海报默认走照片驱动合成：本人照片打底 + 风格调色 + AI 氛围叠入，身份保真不依赖模型心情；图生图提权可用时自动切回模型直出。
- **不写**：把 AI 生成的整页代码再抄一遍冒充手改。
