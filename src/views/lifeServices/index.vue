<template>
  <div class="life-services-page">
    <div class="page-header">
      <h1 class="page-title">生活服务</h1>
      <p class="page-desc">让日常生活更便捷</p>
    </div>

    <div class="tools-grid">
      <router-link to="/lifeServices/lottery" class="tool-card" @click="recordToolClick('/lifeServices/lottery')">
        <div class="tool-card-inner">
          <div class="tool-icon yellow">
            <el-icon :size="32"><Present /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">双色球/大乐透分析</h3>
            <p class="tool-desc">历史开奖数据智能分析，辅助选号参考</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/lifeServices/travelGuide" class="tool-card" @click="recordToolClick('/lifeServices/travelGuide')">
        <div class="tool-card-inner">
          <div class="tool-icon">
            <el-icon :size="32"><MapLocation /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">旅游攻略</h3>
            <p class="tool-desc">热门目的地攻略 + 智能行程规划</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/lifeServices/oilPrice" class="tool-card" @click="recordToolClick('/lifeServices/oilPrice')">
        <div class="tool-card-inner">
          <div class="tool-icon green">
            <el-icon :size="32"><Coin /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">今日油价</h3>
            <p class="tool-desc">全国各省市实时油价一键查询</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/lifeServices/weather" class="tool-card" @click="recordToolClick('/lifeServices/weather')">
        <div class="tool-card-inner">
          <div class="tool-icon blue">
            <el-icon :size="32"><Sunny /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">天气预报</h3>
            <p class="tool-desc">全国城市实时天气与多日预报查询</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/lifeServices/travelMemo" class="tool-card" @click="recordToolClick('/lifeServices/travelMemo')">
        <div class="tool-card-inner">
          <div class="tool-icon orange">
            <el-icon :size="32"><Memo /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">出行备忘</h3>
            <p class="tool-desc">出行物品清单管理，打包不遗漏</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/lifeServices/taskAlchemist" class="tool-card" @click="recordToolClick('/lifeServices/taskAlchemist')">
        <div class="tool-card-inner">
          <div class="tool-icon gold">
            <el-icon :size="32"><MagicStick /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">第二人生·任务炼金术士</h3>
            <p class="tool-desc">精力标签化任务管理、心流专注、时间税防拖延、AI伙伴陪伴成长</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/lifeServices/eternalArchive" class="tool-card" @click="recordToolClick('/lifeServices/eternalArchive')">
        <div class="tool-card-inner">
          <div class="tool-icon teal">
            <el-icon :size="32"><FolderOpened /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">永恒档案</h3>
            <p class="tool-desc">个人重要文档保险库，智能分类、版本管理、安全分享、全文检索</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/lifeServices/recipeLab" class="tool-card" @click="recordToolClick('/lifeServices/recipeLab')">
        <div class="tool-card-inner">
          <div class="tool-icon red">
            <el-icon :size="32"><Dish /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">食验室 · 灵感灶</h3>
            <p class="tool-desc">输入食材智能推荐菜谱，命运之勺随机抽选，解决今天吃什么</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ArrowRight, MapLocation, Coin, Memo, Sunny, Present, MagicStick, FolderOpened, Dish } from '@element-plus/icons-vue'
import { recordToolClick } from '@/api/stats'
</script>

<style lang="scss" scoped src="./index.scss"></style>
