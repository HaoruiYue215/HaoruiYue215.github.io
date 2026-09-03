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
```

## Local preview

```bash
python3 -m http.server 8080
```
