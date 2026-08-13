<template>
  <div class="fund-tools-list">
    <div class="page-header">
      <h1 class="page-title">基金 / 股票</h1>
      <p class="page-desc">投资理财，数据驱动决策</p>
    </div>

    <div class="tools-grid">
      <router-link to="/fund/fund-search" class="tool-card" @click="recordToolClick('/fund/fund-search')">
        <div class="tool-card-inner">
          <div class="tool-icon">
            <el-icon :size="32"><DataLine /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">基金信息查询</h3>
            <p class="tool-desc">实时查询基金净值、涨跌幅与历史走势</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/fund/fund-filter" class="tool-card" @click="recordToolClick('/fund/fund-filter')">
        <div class="tool-card-inner">
          <div class="tool-icon purple">
            <el-icon :size="32"><Filter /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">基金筛选</h3>
            <p class="tool-desc">按业绩、规模、费率多维度筛选优质基金</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/fund/stock-filter" class="tool-card" @click="recordToolClick('/fund/stock-filter')">
        <div class="tool-card-inner">
          <div class="tool-icon green">
            <el-icon :size="32"><TrendCharts /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">股票筛选</h3>
            <p class="tool-desc">多因子量化筛选潜力标的，实时行情评估</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/fund/national-team" class="tool-card" @click="recordToolClick('/fund/national-team')">
        <div class="tool-card-inner">
          <div class="tool-icon red">
            <el-icon :size="32"><Flag /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">跟党走·国家队动向</h3>
            <p class="tool-desc">监测宽基ETF份额变化，倒推国家队进出场时机</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>


    </div>
  </div>
</template>

<script setup>
import { ArrowRight, DataLine, TrendCharts, Filter, Flag } from '@element-plus/icons-vue'
import { recordToolClick } from '@/api/stats'
</script>

<style lang="scss" scoped src="./fundStockToolsList.scss"></style>
