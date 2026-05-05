export function errMsg(error, prefix = "") {
  return prefix + (error?.response?.data?.message || error?.message || "网络错误");
}
