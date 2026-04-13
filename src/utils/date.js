import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD') {
  return dayjs(date).format(format)
}

// 格式化相对时间
export function formatRelativeTime(date) {
  const now = dayjs()
  const target = dayjs(date)
  const diffInMinutes = now.diff(target, 'minute')
  const diffInHours = now.diff(target, 'hour')
  const diffInDays = now.diff(target, 'day')

  if (diffInMinutes < 1) {
    return '刚刚'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`
  } else {
    return formatDate(date, 'YYYY年MM月DD日')
  }
}

// 格式化文章日期
export function formatArticleDate(date) {
  return formatDate(date, 'YYYY年MM月DD日')
}

// 获取文章发布多久了
export function getArticleAge(date) {
  const now = dayjs()
  const articleDate = dayjs(date)
  const diffInDays = now.diff(articleDate, 'day')

  if (diffInDays === 0) {
    return '今天发布'
  } else if (diffInDays === 1) {
    return '昨天发布'
  } else if (diffInDays < 7) {
    return `${diffInDays}天前发布`
  } else if (diffInDays < 30) {
    return `${Math.floor(diffInDays / 7)}周前发布`
  } else if (diffInDays < 365) {
    return `${Math.floor(diffInDays / 30)}个月前发布`
  } else {
    return `${Math.floor(diffInDays / 365)}年前发布`
  }
}