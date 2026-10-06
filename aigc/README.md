# 声纹 SOUNDPRINT · 音乐节 AIGC 海报工位

纯 HTML / CSS / JS，无构建、无后端。四个页面：方案页 `proposal.html`、拍照工位 `index.html`、展示大屏 `wall.html`、扫码分享页 `share.html`。

## 本地跑起来

在本文件夹的**上一级目录**起静态服务：

```bash
python3 -m http.server 8000
```

然后开两个浏览器窗口：

- 拍照工位：<http://localhost:8000/aigc/>
- 展示大屏：<http://localhost:8000/aigc/wall.html>

在工位点「来取你的声纹」开始：同意拍摄须知 → 拍照（可重拍一次）→ 选曲风人格 → 选视觉风格 → 留昵称和一句话 → AI 图生图出海报。大屏自动跟随：吸引轮播 → 拍摄中 → 正在绘制 → 全屏揭晓 → 落入九宫格。工位结果页出二维码，扫码（或同机直接打开分享页）保存海报。

**注意事项：**

- **不要用 `file://` 双击打开。** 摄像头、二维码链接、生图请求都需要 http 环境。
- 摄像头只在 **localhost 或 https** 下可用；摄像头不可用时自动降级为「相册选图」演示模式，不阻塞流程。
- 生图走公网免 Key 接口（Pollinations 三级兜底链路，详见 `AI-USAGE.md`），需要能访问外网；匿名层有限流，失败时工位会明确报错，可点「重试生成」。
- 演示 / 测试可用 URL 参数把会话与单步超时改成秒级：`/aigc/?t_session=20&t_idle=8`。
- 大屏加 `?admin=1` 进入管理员模式：揭晓中或悬停九宫格时按 `d` 下架该张。

## 打包上传

把整个 `aigc` 文件夹打成 zip 即可：

```bash
zip -r soundprint-aigc.zip aigc/
```

解压后在任意静态托管（GitHub Pages / Netlify / OSS 静态站点 / 任意 nginx）原样上传就能用：海报二维码用 `location.origin` 拼分享页路径，换域名、换子路径都不用改配置。本地解压后同样按上面 `python3 -m http.server` 的方式打开。

文件夹是自包含的：唯一的外部静态依赖是 Google Fonts CDN（断网时自动回退系统字体，版式不变）；二维码库已 vendor 在 `js/vendor/qrcode.js`。图床与生图接口是运行时请求，不是构建依赖。

## 页面一览

| 页面 | 地址 | 用途 |
|---|---|---|
| 方案页 | `/aigc/proposal.html` | 玩法、AIGC 价值、转化三方案示意图、内容安全四层 |
| 拍照工位 | `/aigc/index.html` | 主流程：拍照 → 人格 → 风格 → 留话 → 生成 → 出码 |
| 展示大屏 | `/aigc/wall.html` | 第二窗口：吸引 / 拍摄中 / 生成中 / 揭晓 / 九宫格 |
| 分享页 | `/aigc/share.html?id=编号` | 扫码落地页：保存海报，A / B / C 转化入口 |

AI 工具与提示词说明见同目录 `AI-USAGE.md`。
