import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { HARDCODED_USERS } from "@/constants/users";

const parseStoredUsers = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error("Failed to parse stored users:", error);
    return [];
  }
};

const persistStoredUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

const sanitizeUser = (targetUser) => {
  if (!targetUser) return null;

  const { password, ...safeUser } = targetUser;
  return safeUser;
};

const createMockToken = () => {
  return `mock_jwt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const token = ref(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");

  // 获取所有用户（硬编码 + 本地注册）
  const getAllUsers = () => {
    return [...HARDCODED_USERS, ...parseStoredUsers()];
  };

  const getLocalUsers = () => {
    return parseStoredUsers();
  };

  const persistSession = (nextUser) => {
    const safeUser = sanitizeUser(nextUser);
    const nextToken = createMockToken();

    token.value = nextToken;
    user.value = safeUser;

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, nextToken);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));

    return safeUser;
  };

  const clearSession = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  // 登录功能
  const login = (username, password) => {
    const normalizedUsername = username.trim();
    const users = getAllUsers();
    const foundUser = users.find(
      (targetUser) =>
        targetUser.username === normalizedUsername &&
        targetUser.password === password,
    );

    if (!foundUser) {
      return { success: false, message: "用户名或密码错误" };
    }

    const safeUser = persistSession(foundUser);

    return { success: true, user: safeUser };
  };

  // 注册功能
  const register = (username, password) => {
    const normalizedUsername = username.trim();
    const users = getAllUsers();

    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      return { success: false, message: "用户名长度需在 3 到 20 个字符之间" };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return { success: false, message: "用户名仅支持字母、数字和下划线" };
    }

    if (password.length < 6) {
      return { success: false, message: "密码至少需要 6 位" };
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return { success: false, message: "密码需至少包含字母和数字" };
    }

    // 检查用户名是否已存在
    if (
      users.some((targetUser) => targetUser.username === normalizedUsername)
    ) {
      return { success: false, message: "用户名已存在" };
    }

    // 创建新用户
    const newUser = {
      id: `user_${Date.now()}`,
      username: normalizedUsername,
      password,
      role: "user",
      createdAt: new Date().toISOString(),
    };

    // 保存到localStorage
    const localUsers = getLocalUsers();
    localUsers.push(newUser);
    persistStoredUsers(localUsers);

    // 自动登录
    const safeUser = persistSession(newUser);
    return { success: true, user: safeUser };
  };

  const updateLocalUser = (userId, updates) => {
    const localUsers = getLocalUsers();
    const index = localUsers.findIndex(
      (targetUser) => targetUser.id === userId,
    );

    if (index === -1) {
      return { success: false, message: "仅支持修改本地注册用户" };
    }

    const nextUser = {
      ...localUsers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localUsers[index] = nextUser;
    persistStoredUsers(localUsers);

    if (user.value?.id === userId) {
      const safeUser = sanitizeUser(nextUser);
      user.value = safeUser;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    }

    return { success: true, user: sanitizeUser(nextUser) };
  };

  const promoteUserToAdmin = (userId) => {
    return updateLocalUser(userId, { role: "admin" });
  };

  const resetLocalUsers = () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    return { success: true };
  };

  // 注销功能
  const logout = () => {
    clearSession();
  };

  // 初始化：从localStorage恢复用户状态
  const init = () => {
    if (token.value) {
      // 尝试从localStorage恢复用户信息
      const userInfo = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (userInfo) {
        try {
          user.value = JSON.parse(userInfo);
        } catch (e) {
          // 解析失败，清除无效状态
          console.error("Failed to parse user info:", e);
          clearSession();
        }
      } else {
        // 用户信息不存在，清除token
        clearSession();
      }
    }
  };

  // 初始化
  init();

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    getAllUsers,
    getLocalUsers,
    updateLocalUser,
    promoteUserToAdmin,
    resetLocalUsers,
  };
});
