<script setup>
defineProps({
  comments: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})
</script>

<template>
  <section class="comment-timeline" v-loading="loading">
    <el-empty v-if="!comments.length" description="暂无评论" />
    <el-timeline v-else>
      <el-timeline-item
        v-for="comment in comments"
        :key="comment.id"
        :timestamp="comment.createTime || '-'"
        placement="top"
      >
        <strong>{{ comment.commenterName || '-' }}</strong>
        <p>{{ comment.content || '-' }}</p>
      </el-timeline-item>
    </el-timeline>
  </section>
</template>

<style scoped>
.comment-timeline {
  min-height: 120px;
}

.comment-timeline p {
  margin: 6px 0 0;
  color: #475569;
}
</style>