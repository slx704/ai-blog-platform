<template>
  <div class="article-view">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchArticleData" class="retry-btn">重试</button>
      </div>
      
      <div v-else class="article-content">
        <article class="article-main">
          <header class="article-header">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span class="author">{{ article.username || '博主' }}</span>
              <span class="dot">·</span>
              <span class="date">{{ formatDate(article.created_at) }}</span>
              <span class="dot">·</span>
              <span class="views">{{ article.view_count }} 阅读</span>
            </div>
          </header>
          
          <div class="article-body" v-html="renderedContent"></div>
          
          <footer class="article-footer">
            <div class="article-actions">
              <button 
                :class="['action-btn', { liked: isLiked }]" 
                @click="handleLike"
                :disabled="loadingLike"
              >
                <span class="action-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
                <span>{{ article.like_count }} 点赞</span>
              </button>
              <button class="action-btn" @click="scrollToComment">
                <span class="action-icon">💬</span>
                <span>{{ commentCount }} 评论</span>
              </button>
            </div>
            
            <div class="article-tags">
              <span v-for="tag in articleTags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </footer>
        </article>
        
        <div class="comments-section" id="comments">
          <h3 class="comments-title">评论 ({{ commentCount }})</h3>
          
          <div v-if="comments.length === 0" class="empty-comments">
            <p>暂无评论，快来发表第一条评论吧！</p>
          </div>
          
          <div v-else class="comments-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.username }}</span>
                  <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                  <button 
                    v-if="canDeleteComment(comment)" 
                    @click="handleDeleteComment(comment.id)"
                    class="delete-comment-btn"
                  >
                    删除
                  </button>
                  <button 
                    @click="toggleReply(comment.id)"
                    class="reply-btn"
                  >
                    回复
                  </button>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
                
                <button 
                  v-if="comment.translatedContent"
                  @click="showOriginal = !showOriginal"
                  class="translate-toggle"
                >
                  {{ showOriginal ? '显示原文' : '显示翻译' }}
                </button>
                <p v-if="comment.translatedContent && !showOriginal" class="comment-translated">
                  {{ comment.translatedContent }}
                </p>
                
                <button 
                  v-if="!comment.translatedContent"
                  @click="handleTranslateComment(comment)"
                  class="translate-btn"
                >
                  🔄 翻译
                </button>
                
                <div v-if="replyTo === comment.id" class="reply-form">
                  <textarea 
                    v-model="replyContent" 
                    placeholder="写下你的回复..."
                    rows="3"
                    class="reply-input"
                  ></textarea>
                  <div class="reply-actions">
                    <button @click="handleReply(comment.id)" class="reply-submit">发送</button>
                    <button @click="replyTo = null" class="reply-cancel">取消</button>
                  </div>
                </div>
                
                <div v-if="comment.children && comment.children.length > 0" class="nested-comments">
                  <div v-for="child in comment.children" :key="child.id" class="nested-comment">
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="comment-author">{{ child.username }}</span>
                        <span class="comment-date">{{ formatDate(child.created_at) }}</span>
                        <button 
                          v-if="canDeleteComment(child)" 
                          @click="handleDeleteComment(child.id)"
                          class="delete-comment-btn"
                        >
                          删除
                        </button>
                      </div>
                      <p class="comment-text">{{ child.content }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="isLoggedIn" class="comment-form">
            <textarea 
              v-model="newComment" 
              placeholder="写下你的评论..."
              rows="4"
              class="comment-input"
            ></textarea>
            <button @click="handleAddComment" :disabled="submittingComment" class="submit-comment-btn">
              {{ submittingComment ? '提交中...' : '发表评论' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { fetchArticleById } from '../api/articles';
import { fetchCommentsByArticleId, createComment, deleteComment } from '../api/comments';
import { streamTranslate } from '../api/ai';
import { isAuthenticated, getCurrentUser } from '../api/auth';
interface Article {
 id: number;
 title: string;
 content: string;
 view_count: number;
 like_count: number;
 created_at: string;
 username: string;
 tags?: string[];
}
interface Comment {
 id: number;
 article_id: number;
 user_id: number;
 content: string;
 parent_id: number | null;
 username: string;
 created_at: string;
 children?: Comment[];
 translatedContent?: string;
}
const route = useRoute();
const router = useRouter();
const article = ref<Article>({} as Article);
const comments = ref<Comment[]>([]);
const loading = ref(false);
const loadingLike = ref(false);
const error = ref('');
const isLiked = ref(false);
const newComment = ref('');
const replyTo = ref<number | null>(null);
const replyContent = ref('');
const showOriginal = ref(false);
const submittingComment = ref(false);
const articleId = computed(() => Number(route.params.id));
const commentCount = computed(() => {
 let count = comments.value.length;
 comments.value.forEach(c => {
 if (c.children)
 count += c.children.length;
 });
 return count;
});
const articleTags = computed(() => article.value.tags || []);
const isLoggedIn = computed(() => isAuthenticated());
const currentUser = computed(() => getCurrentUser());
const renderedContent = computed(() => {
 if (!article.value.content)
 return '';
 const html = marked.parse(article.value.content, { async: false }) as string;
 return DOMPurify.sanitize(html);
});
const formatDate = (dateString: string) => {
 const date = new Date(dateString);
 return date.toLocaleDateString('zh-CN', {
 year: 'numeric',
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit'
 });
};
const fetchArticleData = async () => {
 loading.value = true;
 error.value = '';
 try {
 article.value = await fetchArticleById(articleId.value);
 await fetchComments();
 }
 catch (err) {
 error.value = '获取文章失败';
 }
 finally {
 loading.value = false;
 }
};
const fetchComments = async () => {
 try {
 const data = await fetchCommentsByArticleId(articleId.value);
 console.log('获取到的评论数据:', data);
 comments.value = data;
 }
 catch (err) {
 console.error('获取评论失败:', err);
 alert('获取评论失败，请刷新页面重试');
 }
};
const handleLike = async () => {
 if (!isLoggedIn.value) {
 router.push('/login');
 return;
 }
 loadingLike.value = true;
 try {
 const response = await fetch('/api/likes/toggle', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${localStorage.getItem('token')}`
 },
 body: JSON.stringify({ articleId: articleId.value })
 });
 const data = await response.json();
 if (data.success) {
 isLiked.value = data.data.liked;
 article.value.like_count += isLiked.value ? 1 : -1;
 }
 }
 catch (err) {
 console.error('点赞失败:', err);
 }
 finally {
 loadingLike.value = false;
 }
};
const handleAddComment = async () => {
 if (!newComment.value.trim())
 return;
 submittingComment.value = true;
 try {
 console.log('正在提交评论:', newComment.value);
 const result = await createComment(articleId.value, newComment.value.trim());
 console.log('评论提交结果:', result);
 
 const newCommentObj: Comment = {
   id: result.id,
   article_id: articleId.value,
   user_id: currentUser.value?.id || 0,
   content: newComment.value.trim(),
   parent_id: null,
   username: currentUser.value?.username || '匿名用户',
   created_at: new Date().toISOString(),
   children: []
 };
 
 comments.value = [...comments.value, newCommentObj];
 newComment.value = '';
 console.log('评论已添加到列表');
 }
 catch (err) {
 console.error('发表评论失败:', err);
 alert('发表评论失败，请稍后重试');
 }
 finally {
 submittingComment.value = false;
 }
};
const handleReply = async (parentId: number) => {
 if (!replyContent.value.trim())
 return;
 submittingComment.value = true;
 try {
 console.log('正在提交回复:', replyContent.value);
 const result = await createComment(articleId.value, replyContent.value.trim(), parentId);
 console.log('回复提交结果:', result);
 
 const newReplyObj: Comment = {
   id: result.id,
   article_id: articleId.value,
   user_id: currentUser.value?.id || 0,
   content: replyContent.value.trim(),
   parent_id: parentId,
   username: currentUser.value?.username || '匿名用户',
   created_at: new Date().toISOString()
 };
 
 const parentComment = comments.value.find(c => c.id === parentId);
 if (parentComment) {
   if (!parentComment.children) {
     parentComment.children = [];
   }
   parentComment.children = [...(parentComment.children || []), newReplyObj];
 }
 
 replyContent.value = '';
 replyTo.value = null;
 console.log('回复已添加到列表');
 }
 catch (err) {
 console.error('回复评论失败:', err);
 alert('回复失败，请稍后重试');
 }
 finally {
 submittingComment.value = false;
 }
};
const toggleReply = (commentId: number) => {
 replyTo.value = replyTo.value === commentId ? null : commentId;
 replyContent.value = '';
};
const handleDeleteComment = async (commentId: number) => {
 if (!confirm('确定删除这条评论吗？'))
 return;
 try {
 console.log('正在删除评论:', commentId);
 await deleteComment(commentId);
 
 comments.value = comments.value.filter(c => c.id !== commentId);
 comments.value.forEach(c => {
 if (c.children) {
 c.children = c.children.filter(child => child.id !== commentId);
 }
 });
 
 console.log('评论已从列表中删除');
 }
 catch (err) {
 console.error('删除评论失败:', err);
 alert('删除评论失败，请稍后重试');
 }
};
const canDeleteComment = (comment: Comment) => {
 return currentUser.value && currentUser.value.id === comment.user_id;
};
const handleTranslateComment = async (comment: Comment) => {
 try {
 let result = '';
 await streamTranslate(comment.content, '中文', (chunk) => {
 result += chunk;
 });
 comment.translatedContent = result;
 showOriginal.value = false;
 }
 catch (err) {
 console.error('翻译失败:', err);
 }
};
const scrollToComment = () => {
 document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
};
onMounted(() => {
 fetchArticleData();
});
</script>

<style scoped>
.article-view {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 30px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading {
  text-align: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 40px 0;
  color: #d32f2f;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.article-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  overflow: hidden;
}

.article-main {
  padding: 30px;
}

.article-header {
  margin-bottom: 30px;
}

.article-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.article-meta {
  font-size: 14px;
  color: #999;
  display: flex;
  gap: 8px;
}

.article-body {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.article-body :deep(h1) {
  font-size: 24px;
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.article-body :deep(h2) {
  font-size: 20px;
  margin: 20px 0 12px;
}

.article-body :deep(h3) {
  font-size: 18px;
  margin: 16px 0 10px;
}

.article-body :deep(p) {
  margin: 12px 0;
}

.article-body :deep(code) {
  background: #f0f2f5;
  padding: 2px 6px;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  border-radius: 3px;
}

.article-body :deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
}

.article-body :deep(pre code) {
  background: none;
  padding: 0;
}

.article-body :deep(blockquote) {
  border-left: 3px solid #667eea;
  margin: 16px 0;
  padding-left: 16px;
  color: #666;
}

.article-body :deep(a) {
  color: #667eea;
  text-decoration: none;
}

.article-body :deep(a:hover) {
  text-decoration: underline;
}

.article-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.article-actions {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #f5f7fa;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #e8eaed;
}

.action-btn.liked {
  background: #ffeef0;
}

.action-icon {
  font-size: 16px;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 5px 12px;
  background: #f0f0f0;
  border-radius: 15px;
  font-size: 12px;
  color: #666;
}

.comments-section {
  padding: 30px;
  border-top: 1px solid #eee;
}

.comments-title {
  font-size: 18px;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.empty-comments {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  padding: 20px;
  background: #fafafa;
  border-radius: 10px;
}

.comment-content {
  background: white;
  padding: 15px;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-author {
  font-weight: 600;
  color: #333;
}

.comment-date {
  font-size: 12px;
  color: #999;
}

.delete-comment-btn, .reply-btn {
  margin-left: auto;
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-comment-btn {
  background: #fff0f0;
  color: #d32f2f;
}

.reply-btn {
  background: #f0f7ff;
  color: #667eea;
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin: 0;
}

.comment-translated {
  font-size: 13px;
  line-height: 1.6;
  color: #666;
  margin: 10px 0 0 0;
  padding-top: 10px;
  border-top: 1px dashed #eee;
  font-style: italic;
}

.translate-btn, .translate-toggle {
  margin-top: 10px;
  padding: 4px 10px;
  font-size: 12px;
  background: #f0f7ff;
  color: #667eea;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reply-form {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #eee;
}

.reply-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.reply-submit {
  padding: 6px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reply-cancel {
  padding: 6px 16px;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.nested-comments {
  margin-top: 15px;
  padding-left: 20px;
  border-left: 2px solid #eee;
}

.nested-comment {
  margin-top: 15px;
}

.comment-form {
  margin-top: 20px;
}

.comment-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
}

.submit-comment-btn {
  margin-top: 12px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  float: right;
}

@media (max-width: 768px) {
  .article-main, .comments-section {
    padding: 20px;
  }
  
  .article-title {
    font-size: 22px;
  }
  
  .article-actions {
    gap: 10px;
  }
  
  .action-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
}
</style>