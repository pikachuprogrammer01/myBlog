import { ElMessageBox } from "element-plus";

const BASE = { appendTo: "#app", lockScroll: false };

export function confirmThen(message, title, type, fn) {
  return ElMessageBox.confirm(message, title, {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type,
    ...BASE,
  }).then(fn).catch(() => {});
}
