<template>
  <div ref="commentFormRoot" class="comment-form">
    <!-- 登录提示 -->
    <div v-if="!isLoggedIn" class="login-prompt">
      <el-alert
        title="请先登录"
        type="warning"
        :closable="false"
        description="登录后即可发表评论"
      />
      <div class="login-actions">
        <el-button type="primary" @click="$router.push('/login')">
          登录
        </el-button>
        <el-button @click="$router.push('/register')"> 注册 </el-button>
      </div>
    </div>

    <!-- 评论表单 -->
    <div v-else class="form-container">
      <div class="form-header">
        <div class="user-info">
          <el-avatar :size="40" :src="userAvatar" />
          <div class="user-details">
            <div class="username">{{ currentUser.username }}</div>
            <div class="user-role">
              <el-tag
                v-if="currentUser.role === 'admin'"
                size="small"
                type="danger"
              >
                管理员
              </el-tag>
              <span v-else class="role-text">普通用户</span>
            </div>
          </div>
        </div>

        <div v-if="showCancelButton" class="form-actions">
          <el-button v-if="!isEditing" link size="small" @click="handleCancel">
            取消
          </el-button>
          <el-button v-else link size="small" @click="handleCancelEdit">
            取消编辑
          </el-button>
        </div>
      </div>

      <!-- 表单内容 -->
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        class="comment-form-content"
      >
        <!-- 评论内容 -->
        <el-form-item prop="content">
          <div class="editor-container">
            <div class="editor-toolbar">
              <div class="toolbar-left">
                <el-button-group>
                  <el-button
                    link
                    size="small"
                    :class="{ active: editorState.bold }"
                    @click="toggleMarkdown('bold')"
                  >
                    <strong>B</strong>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    :class="{ active: editorState.italic }"
                    @click="toggleMarkdown('italic')"
                  >
                    <em>I</em>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    :class="{ active: editorState.link }"
                    @click="insertLink"
                  >
                    <el-icon><Link /></el-icon>
                  </el-button>
                  <el-button link size="small" @click="insertCode">
                    <el-icon><Comment /></el-icon>
                  </el-button>
                </el-button-group>
              </div>

              <div class="toolbar-right">
                <span class="char-count">
                  {{ form.content.length }}/{{ maxLength }}
                </span>
              </div>
            </div>

            <el-input
              v-model="form.content"
              type="textarea"
              :rows="4"
              :placeholder="placeholder"
              :maxlength="maxLength"
              show-word-limit
              resize="none"
              @input="handleContentChange"
              @keydown.ctrl.enter="handleSubmit"
            />

            <!-- 实时预览 -->
            <div v-if="showPreview" class="preview-container">
              <div class="preview-header">
                <el-tabs v-model="activeTab">
                  <el-tab-pane label="编辑" name="edit" />
                  <el-tab-pane label="预览" name="preview" />
                </el-tabs>
              </div>

              <div v-if="activeTab === 'preview'" class="preview-content">
                <div class="preview-text" v-html="previewContent" />
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 表单选项 -->
        <div v-if="showOptions" class="form-options">
          <el-form-item>
            <el-checkbox
              v-model="form.options.notify"
              label="有新回复时通知我"
            />
          </el-form-item>
          <el-form-item v-if="isAdmin">
            <el-checkbox v-model="form.options.sticky" label="置顶评论" />
          </el-form-item>
        </div>

        <!-- 提交按钮 -->
        <el-form-item>
          <div class="submit-actions">
            <el-button
              type="primary"
              :loading="submitting"
              :disabled="!form.content.trim()"
              @click="handleSubmit"
            >
              {{ computedSubmitButtonText }}
            </el-button>
            <el-button v-if="showClearButton" @click="handleClear">
              清空
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <!-- 评论提示 -->
      <div v-if="showTips" class="comment-tips">
        <el-alert
          title="评论提示"
          type="info"
          :closable="false"
          :description="tips"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, reactive, watch, nextTick } from "vue";
  import { ElMessage, ElMessageBox } from "element-plus";

  import { Link, Comment } from "@element-plus/icons-vue";
  import { useAuth } from "@/composables/useAuth";
  import { useComments } from "@/composables/useComments";
  import MarkdownIt from "markdown-it";

  const props = defineProps({
    // 文章ID
    articleId: {
      type: String,
      required: true,
    },
    // 父评论ID（用于回复）
    parentId: {
      type: String,
      default: "",
    },
    // 编辑的评论ID
    editCommentId: {
      type: String,
      default: "",
    },
    // 是否显示取消按钮
    showCancelButton: {
      type: Boolean,
      default: true,
    },
    // 是否显示清除按钮
    showClearButton: {
      type: Boolean,
      default: true,
    },
    // 是否显示预览
    showPreview: {
      type: Boolean,
      default: true,
    },
    // 是否显示选项
    showOptions: {
      type: Boolean,
      default: true,
    },
    // 是否显示提示
    showTips: {
      type: Boolean,
      default: true,
    },
    // 最大长度
    maxLength: {
      type: Number,
      default: 1000,
    },
    // 占位符文本
    placeholder: {
      type: String,
      default: "请输入评论内容...（支持Markdown语法）",
    },
    // 提交按钮文本
    submitButtonText: {
      type: String,
      default: "提交评论",
    },
    // 是否自动聚焦
    autoFocus: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(["submit", "cancel"]);

  const { currentUser } = useAuth();
  const { addComment, updateComment } = useComments();

  // 响应式状态
  const commentFormRoot = ref(null);
  const formRef = ref(null);
  const form = reactive({
    content: '',
    options: {
      notify: true,
      sticky: false,
    },
  });
  const editorState = reactive({
    bold: false,
    italic: false,
    link: false,
  });
  const submitting = ref(false);
  const activeTab = ref('edit');
  const isLoggedIn = computed(() => !!currentUser.value);
  const isAdmin = computed(() => currentUser.value?.role === "admin");
  const isEditing = computed(() => !!props.editCommentId);

  // 用户头像
  const userAvatar = computed(() => {
    if (!currentUser.value) return "";
    if (currentUser.value.avatarUrl) return currentUser.value.avatarUrl;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.value.username}`;
  });

  // 验证规则
  const rules = {
    content: [
      { required: true, message: "评论内容不能为空", trigger: "blur" },
      {
        min: 1,
        max: props.maxLength,
        message: `评论内容长度在 1 到 ${props.maxLength} 个字符`,
        trigger: "blur",
      },
    ],
  };

  // Markdown处理器
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true,
  });

  // 预览内容
  const previewContent = computed(() => {
    if (!form.content.trim())
      return '<p class="preview-empty">输入内容后预览</p>';
    return md.render(form.content);
  });

  // 提示文本
  const tips = computed(() => {
    const tipList = [
      "请遵守社区规范，文明评论",
      "支持Markdown语法",
      "Ctrl+Enter 快速提交",
    ];
    if (isAdmin.value) {
      tipList.push("管理员可以置顶评论");
    }
    return tipList.join("；");
  });

  // 提交按钮文本
  const computedSubmitButtonText = computed(() => {
    if (submitting.value) return "提交中...";
    if (isEditing.value) return "更新评论";
    if (props.parentId) return "回复";
    return props.submitButtonText;
  });

  const getTextarea = () => {
    return commentFormRoot.value?.querySelector("textarea") || null;
  };

  // 处理内容变化
  const handleContentChange = (value) => {
    // 检测光标位置和选中的文本，更新编辑器状态
    // 这里简化处理，实际应用中需要更复杂的逻辑
  };

  // 切换Markdown格式
  const toggleMarkdown = (type) => {
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.content.substring(start, end);

    let before = "";
    let after = "";
    let insertText = selectedText;

    switch (type) {
      case "bold":
        before = "**";
        after = "**";
        editorState.bold = !editorState.bold;
        break;
      case "italic":
        before = "*";
        after = "*";
        editorState.italic = !editorState.italic;
        break;
    }

    const newText = before + insertText + after;
    const newContent =
      form.content.substring(0, start) + newText + form.content.substring(end);

    form.content = newContent;

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      const newStart = start + before.length;
      const newEnd = end + before.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  // 插入链接
  const insertLink = () => {
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.content.substring(start, end) || "链接文本";

    ElMessageBox.prompt("请输入链接地址", "插入链接", {
      confirmButtonText: "插入",
      cancelButtonText: "取消",
      inputPlaceholder: "https://example.com",
    })
      .then(({ value }) => {
        if (value) {
          const linkText = `[${selectedText}](${value})`;
          const newContent =
            form.content.substring(0, start) +
            linkText +
            form.content.substring(end);
          form.content = newContent;
        }
      })
      .catch(() => {
        // 用户取消
      });
  };

  // 插入代码
  const insertCode = () => {
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.content.substring(start, end) || "代码";

    ElMessageBox.prompt("请选择语言（可选）", "插入代码", {
      confirmButtonText: "插入",
      cancelButtonText: "取消",
      inputPlaceholder: "javascript, python, html...",
    })
      .then(({ value }) => {
        const language = value?.trim() || "";
        const codeBlock = language
          ? `\`\`\`${language}\n${selectedText}\n\`\`\``
          : `\`${selectedText}\``;

        const newContent =
          form.content.substring(0, start) +
          codeBlock +
          form.content.substring(end);
        form.content = newContent;
      })
      .catch(() => {
        // 用户取消
      });
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      // 验证表单
      await formRef.value.validate();

      if (!currentUser.value) {
        ElMessage.warning("请先登录");
        return;
      }

      submitting.value = true;

      let result;
      if (isEditing.value) {
        result = await updateComment(props.editCommentId, form.content.trim());
      } else {
        result = await addComment(props.articleId, form.content.trim(), props.parentId || null);
      }

      if (result.success) {
        ElMessage.success(isEditing.value ? "评论已更新" : "评论已提交");

        // 清空表单
        if (!isEditing.value) {
          form.content = "";
          form.options.notify = true;
          form.options.sticky = false;
        }

        emit("submit", result.comment);
      } else {
        ElMessage.error(result.message || "提交失败");
      }
    } catch (error) {
      console.error("提交评论失败:", error);
      if (error instanceof Error) {
        ElMessage.error("提交失败: " + error.message);
      }
    } finally {
      submitting.value = false;
    }
  };

  // 处理清除
  const handleClear = () => {
    form.content = "";
    form.options.notify = true;
    form.options.sticky = false;
    ElMessage.info("已清空评论内容");
  };

  // 处理取消
  const handleCancel = () => {
    if (form.content.trim()) {
      ElMessageBox.confirm("确定要取消吗？已输入的内容将会丢失", "确认取消", {
        confirmButtonText: "确定",
        cancelButtonText: "继续编辑",
        type: "warning",
      })
        .then(() => {
          form.content = "";
          emit("cancel");
        })
        .catch(() => {
          // 用户选择继续编辑
        });
    } else {
      emit("cancel");
    }
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    ElMessageBox.confirm("确定要取消编辑吗？未保存的修改将会丢失", "确认取消", {
      confirmButtonText: "确定",
      cancelButtonText: "继续编辑",
      type: "warning",
    })
      .then(() => {
        emit("cancel");
      })
      .catch(() => {
        // 用户选择继续编辑
      });
  };

  // 监听编辑评论ID
  watch(
    () => props.editCommentId,
    (newId) => {
      if (newId) {
        // Edit mode: content is populated by parent component via event
      } else {
        form.content = '';
        form.options.notify = true;
        form.options.sticky = false;
      }
    },
    { immediate: true },
  );

  // 自动聚焦
  const autoFocusTextarea = async () => {
    if (props.autoFocus) {
      await nextTick();
      const textarea = getTextarea();
      if (textarea) {
        textarea.focus();
      }
    }
  };

  watch(
    () => [props.autoFocus, props.parentId, props.editCommentId],
    () => {
      autoFocusTextarea();
    },
    { immediate: true },
  );
</script>

<style scoped lang="scss">
  .comment-form {
    .login-prompt {
      text-align: center;
      padding: var(--blog-spacing-lg);

      .login-actions {
        display: flex;
        justify-content: center;
        gap: var(--blog-spacing-md);
        margin-top: var(--blog-spacing-md);
      }
    }

    .form-container {
      .form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--blog-spacing-lg);

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--blog-spacing-md);

          .user-details {
            .username {
              font-weight: 600;
              margin-bottom: 2px;
            }

            .user-role {
              font-size: 12px;

              .role-text {
                color: var(--blog-text-secondary);
              }
            }
          }
        }

        .form-actions {
          .el-button {
            color: var(--blog-text-secondary);

            &:hover {
              color: var(--blog-primary-color);
            }
          }
        }
      }

      .comment-form-content {
        .editor-container {
          .editor-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--blog-spacing-sm);
            padding: var(--blog-spacing-xs) var(--blog-spacing-sm);
            background-color: var(--blog-bg-gray);
            border-radius: var(--blog-border-radius) var(--blog-border-radius) 0
              0;

            .toolbar-left {
              .el-button-group {
                .el-button {
                  padding: 4px 8px;
                  min-height: auto;
                  font-size: 14px;

                  &.active {
                    color: var(--blog-primary-color);
                    background-color: rgba(242, 201, 76, 0.1);
                  }

                  strong,
                  em {
                    font-style: normal;
                  }
                }
              }
            }

            .toolbar-right {
              .char-count {
                font-size: 12px;
                color: var(--blog-text-secondary);
              }
            }
          }

          .preview-container {
            margin-top: var(--blog-spacing-md);
            border: 1px solid var(--blog-border-color);
            border-radius: var(--blog-border-radius);

            .preview-header {
              padding: var(--blog-spacing-sm) var(--blog-spacing-md);
              background-color: var(--blog-bg-gray);
              border-bottom: 1px solid var(--blog-border-color);
            }

            .preview-content {
              padding: var(--blog-spacing-md);
              min-height: 100px;
              max-height: 300px;
              overflow-y: auto;

              .preview-text {
                :deep() {
                  p {
                    margin: 0 0 var(--blog-spacing-sm);
                  }

                  a {
                    color: var(--blog-primary-color);
                  }

                  code {
                    background-color: var(--blog-bg-gray);
                    padding: 2px 4px;
                    border-radius: 2px;
                  }

                  pre {
                    background-color: var(--blog-bg-gray);
                    padding: var(--blog-spacing-sm);
                    border-radius: var(--blog-border-radius);
                    overflow-x: auto;
                  }
                }

                &.preview-empty {
                  color: var(--blog-text-secondary);
                  font-style: italic;
                  text-align: center;
                  padding: var(--blog-spacing-lg);
                }
              }
            }
          }
        }

        .form-options {
          margin-top: var(--blog-spacing-md);
        }

        .submit-actions {
          display: flex;
          gap: var(--blog-spacing-md);
          margin-top: var(--blog-spacing-md);
        }
      }

      .comment-tips {
        margin-top: var(--blog-spacing-md);
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .comment-form {
      .form-container {
        .form-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--blog-spacing-md);

          .form-actions {
            align-self: flex-end;
          }
        }

        .comment-form-content {
          .editor-container {
            .editor-toolbar {
              flex-direction: column;
              align-items: stretch;
              gap: var(--blog-spacing-sm);

              .toolbar-left {
                .el-button-group {
                  flex-wrap: wrap;
                }
              }

              .toolbar-right {
                text-align: right;
              }
            }
          }
        }
      }
    }
  }
</style>
