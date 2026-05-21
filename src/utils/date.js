import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn'; // 引入中文语言包

dayjs.locale('zh-cn')
dayjs.extend(relativeTime);

// 格式化日期
export function formatDate (date, format = 'YYYY-MM-DD') {
  return dayjs(date).format(format)
}

// 格式化相对时间
export function formatRelativeTime (date) {
  return dayjs(date).fromNow() + '发布';
}

// 格式化文章日期
export function formatArticleDate (date) {
  return formatDate(date, 'YYYY年MM月DD日')
}

// 获取文章发布多久了
export function getArticleAge (date) {
  const now = dayjs();
  const target = dayjs(date);

  const diffInMinutes = now.diff(target, 'minute');

  // 防御性代码：如果是未来的时间
  if (diffInMinutes < 0) return '刚刚';

  // 将分钟转换为小时和天数（这样可以保证天数和小时的递进是完全精准的）
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // 定义区间规则（从小到大排序）
  const rules = [
    { value: diffInMinutes, max: 1, label: '刚刚' },
    { value: diffInMinutes, max: 60, label: `${diffInMinutes}分钟前` },
    { value: diffInHours, max: 24, label: `${diffInHours}小时前` },
    { value: diffInDays, max: 7, label: `${diffInDays}天前` },
  ];

  // 寻找第一个符合区间范围的规则
  const matched = rules.find(rule => rule.value < rule.max);

  // 如果符合规则就返回，否则返回绝对时间
  return matched ? matched.label : target.format('YYYY年MM月DD日');
}