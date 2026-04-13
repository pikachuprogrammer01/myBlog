#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('🔍 开始博客项目健康检查...\n')

// 检查的关键文件
const criticalFiles = [
  'package.json',
  'vite.config.js',
  'src/main.js',
  'src/router/index.js',
  'src/stores/auth.js',
  'src/data/articles.json',
  'public/images/article1.jpg',
  'public/images/carousel1.jpg'
]

let allPassed = true

// 检查文件是否存在
console.log('📁 检查关键文件是否存在:')
for (const file of criticalFiles) {
  const filePath = path.join(rootDir, file)
  const exists = fs.existsSync(filePath)
  const status = exists ? '✅' : '❌'
  console.log(`  ${status} ${file}`)
  if (!exists) allPassed = false
}

// 检查package.json脚本和依赖
console.log('\n📦 检查package.json脚本和依赖:')
try {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
  const requiredScripts = ['dev', 'build', 'preview', 'deploy', 'test']
  for (const script of requiredScripts) {
    const hasScript = pkgJson.scripts && pkgJson.scripts[script]
    const status = hasScript ? '✅' : '❌'
    console.log(`  ${status} npm run ${script}`)
    if (!hasScript) allPassed = false
  }

  // 检查gh-pages依赖
  const hasGhPages = pkgJson.devDependencies && pkgJson.devDependencies['gh-pages']
  const status = hasGhPages ? '✅' : '❌'
  console.log(`  ${status} gh-pages 依赖`)
  if (!hasGhPages) allPassed = false
} catch (error) {
  console.log(`  ❌ 无法读取package.json: ${error.message}`)
  allPassed = false
}

// 检查图片文件
console.log('\n🖼️  检查图片资源:')
const imageDir = path.join(rootDir, 'public/images')
try {
  const images = fs.readdirSync(imageDir)
  console.log(`  ✅ 找到 ${images.length} 个图片文件`)
  if (images.length === 0) {
    console.log('  ⚠️  图片目录为空')
    allPassed = false
  }
} catch (error) {
  console.log(`  ❌ 无法读取图片目录: ${error.message}`)
  allPassed = false
}

// 总结
console.log('\n' + '='.repeat(50))
if (allPassed) {
  console.log('🎉 所有健康检查通过！项目配置完整。')
  console.log('\n下一步建议:')
  console.log('1. 运行 npm run dev 启动开发服务器')
  console.log('2. 运行 npm run test 执行测试')
  console.log('3. 运行 npm run build 构建生产版本')
  console.log('4. 运行 npm run deploy 部署到GitHub Pages')
} else {
  console.log('⚠️  健康检查发现一些问题，请检查上述错误。')
  process.exit(1)
}