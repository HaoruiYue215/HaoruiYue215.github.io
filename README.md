# HAORUI YUE — Personal Site

个人网站 · Architecture × Geospatial Data × AI Product

黑白极简风格，灵感来自 [Vaulk](https://vaulk.com)：3D 线框建筑动画、建筑蓝图线稿插图、自定义光标、滚动动效。纯静态 HTML/CSS/JS，无需构建，托管于 GitHub Pages。

Live: https://haoruiyue215.github.io/

## Tech

- Vanilla HTML / CSS / JS
- [GSAP](https://gsap.com) + ScrollTrigger — 滚动动效
- [Three.js](https://threejs.org) — 首页 3D 线框建筑
- GitHub Pages — 部署

## Structure

```
index.html
css/style.css
js/main.js        # loader, cursor, scroll reveal, counters
js/wireframe.js   # three.js wireframe tower
resume/           # 英文简历（投递用）
```

## Local preview

```bash
python3 -m http.server 8080
```

## Resume

`resume/` 内为投递用英文简历：

- `haorui-yue-resume-en.html` — A4 排版源文件（改内容只需改这里）
- `Haorui_Yue_Resume_EN.pdf` — 投递用 PDF
- `haorui-yue-resume-en.md` — 纯文本版，便于粘贴到在线申请表

改完 HTML 后重新导出 PDF：

```bash
cd resume
google-chrome --headless=new --no-pdf-header-footer \
  --print-to-pdf=Haorui_Yue_Resume_EN.pdf haorui-yue-resume-en.html
```
