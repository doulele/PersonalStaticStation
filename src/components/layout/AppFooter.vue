<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-links">
        <span class="copyright">Copyright © 2026 All Rights Reserved 野生猿博客</span>
        <span class="footer-divider">|</span>
        <span class="footer-link">友情链接 QQ:1220736335</span>
      </div>
      <div class="footer-beian">
        <a
          class="beian-link"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
        >
          浙ICP备19047797号-1
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 备案号：浙ICP备19047797号-1
</script>

<style lang="scss" scoped>
.app-footer {
  background: var(--footer-bg);
  padding: 20px 24px;
  margin-top: auto;
  transition: background 0.4s ease;
}

.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.copyright {
  font-size: 0.78rem;
  color: var(--footer-text);
  transition: color 0.4s ease;
}

.footer-link {
  font-size: 0.78rem;
  color: var(--footer-text);
  transition: color 0.4s ease;
}

.footer-divider {
  font-size: 0.78rem;
  color: var(--footer-divider);
  transition: color 0.4s ease;
}

.footer-beian {
  display: flex;
  align-items: center;
}

.beian-link {
  text-decoration: none;
  color: var(--footer-beian);
  font-size: 0.75rem;
  transition: color 0.2s ease;

  &:hover {
    color: var(--footer-beian-hover);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .app-footer {
    padding: 16px 16px;
  }

  .footer-inner {
    gap: 8px;
  }

  .copyright,
  .footer-link {
    font-size: 0.7rem;
  }

  .beian-link {
    font-size: 0.68rem;
  }
}
</style>
