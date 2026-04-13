import{af as m,r as v,c as i}from"./index-C6oQ0Fej.js";const f=[{id:"localstorage-web-app",title:"基于localStorage的Web应用数据持久化",date:"2026-04-01",tags:["localStorage","数据持久化","前端"],excerpt:"探索在前端应用中使用localStorage进行数据持久化的最佳实践。",cover:"/images/article5.jpg",published:!0,content:`# 基于localStorage的Web应用数据持久化

localStorage是浏览器提供的本地存储方案。

## localStorage API

\`\`\`javascript
// 保存数据
localStorage.setItem('key', 'value');

// 读取数据
const value = localStorage.getItem('key');

// 删除数据
localStorage.removeItem('key');
\`\`\`

## 注意事项

1. 存储容量有限（通常5MB）
2. 仅支持字符串类型
3. 同源策略限制
4. 无过期时间`},{id:"static-site-generation",title:"静态网站生成与部署",date:"2026-03-20",tags:["Vite","部署","GitHub Pages"],excerpt:"如何使用Vite构建静态网站并部署到GitHub Pages。",cover:"/images/article4.jpg",published:!0,content:`# 静态网站生成与部署

静态网站具有速度快、安全性高、成本低等优点。

## 为什么选择静态网站

- 极快的加载速度
- 更高的安全性（无服务器端漏洞）
- 低成本甚至免费托管
- 易于版本控制

## 部署到GitHub Pages

1. 创建GitHub仓库
2. 配置GitHub Pages
3. 推送构建文件
4. 访问你的网站`},{id:"element-plus-tutorial",title:"Element Plus 组件库使用教程",date:"2026-03-05",tags:["Element Plus","UI","组件库"],excerpt:"学习如何使用Element Plus快速构建美观的Vue 3应用。",cover:"/images/article3.jpg",published:!0,content:`# Element Plus 组件库使用教程

Element Plus是一个基于Vue 3的组件库，提供了丰富的UI组件。

## 安装

\`\`\`bash
npm install element-plus --save
\`\`\`

## 基本使用

\`\`\`vue
<template>
  <el-button type="primary">主要按钮</el-button>
</template>
\`\`\``},{id:"vue3-composition-api",title:"Vue 3 Composition API 入门指南",date:"2026-02-10",tags:["Vue","Composition API","前端"],excerpt:"深入理解Vue 3 Composition API的核心概念和用法。",cover:"/images/article2.jpg",published:!0,content:`# Vue 3 Composition API 入门指南

Composition API是Vue 3的核心特性之一。

## 什么是Composition API

Composition API 是一种新的代码组织方式，允许你更好地组织和重用代码逻辑。

### 优势

1. 更好的逻辑复用
2. 更灵活的类型推断
3. 更清晰的代码结构`},{id:"hello-world",title:"Hello World",date:"2026-01-15",tags:["Vue","JavaScript","教程"],excerpt:"这是我的第一篇博客文章，介绍Vue 3的基本概念。",cover:"/images/article1.jpg",published:!0,content:`# Hello World

欢迎来到我的博客！这是我的第一篇文章。

## 内容简介

本文将介绍博客的基本功能和特点。`}],b=m("article",()=>{const o=v(f),l=()=>[...o.value].sort((n,e)=>new Date(e.date)-new Date(n.date)),c=n=>o.value.find(e=>e.id===n),u=n=>o.value.filter(e=>e.tags&&e.tags.includes(n)),g=n=>{if(!n.trim())return[];const e=n.toLowerCase();return o.value.filter(t=>t.title.toLowerCase().includes(e)||t.excerpt.toLowerCase().includes(e)||t.content.toLowerCase().includes(e))},p=i(()=>{const n={};return o.value.forEach(e=>{e.tags&&e.tags.forEach(t=>{n[t]=(n[t]||0)+1})}),Object.entries(n).sort((e,t)=>t[1]-e[1]).slice(0,10).map(([e,t])=>({tag:e,count:t}))}),d=i(()=>{const n={};return o.value.forEach(e=>{if(e.date){const t=new Date(e.date),s=t.getFullYear(),a=t.getMonth()+1,r=`${s}-${a.toString().padStart(2,"0")}`;n[r]||(n[r]={year:s,month:a,key:r,display:`${s}年${a}月`,articles:[]}),n[r].articles.push(e)}}),Object.values(n).sort((e,t)=>e.year!==t.year?t.year-e.year:t.month-e.month)});return{articles:o,getAllArticles:l,getArticleById:c,getArticlesByTag:u,searchArticles:g,getPopularTags:p,getArticlesByArchive:d,getPreviousNextArticles:n=>{const e=l(),t=e.findIndex(r=>r.id===n);if(t===-1)return{previous:null,next:null};const s=t>0?e[t-1]:null,a=t<e.length-1?e[t+1]:null;return{previous:s,next:a}},incrementViews:n=>{const e=o.value.find(t=>t.id===n);e&&(e.views||(e.views=0),e.views++)}}});export{b as u};
