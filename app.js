/* =====================================================
   盐城师范学院2026级新生服务大厅 · 交互脚本
   高性能优化版本 · 针对移动端特别优化
   ===================================================== */

(function () {
    "use strict";

    /* ---------- 工具函数 ---------- */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    const on = (el, evt, handler, opts) => {
        if (!el) return;
        el.addEventListener(evt, handler, opts);
    };

    // 检测是否为移动端（简单判断：屏幕宽度 <= 900px 或触摸设备）
    const isMobile = () => window.innerWidth <= 900 || ("ontouchstart" in window);

    // 节流函数：限制滚动等高频事件的触发频率
    const throttle = (fn, limit) => {
        let inThrottle = false;
        return function () {
            if (!inThrottle) {
                fn.apply(this, arguments);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    };

    /* ---------- 1. Toast 轻提示 ---------- */
    let toastTimer = null;
    function showToast(msg, duration = 1800) {
        let toast = $("#__toast__");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "__toast__";
            toast.className = "toast";
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add("visible");
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove("visible");
        }, duration);
    }

    /* ---------- 2. 合并滚动处理（导航阴影 + 返回顶部） ---------- */
    function initScrollHandlers() {
        const nav = $(".nav-bar");
        const backToTop = $("#backToTop");

        const handleScroll = throttle(() => {
            const scrollY = window.scrollY;
            if (nav) {
                if (scrollY > 10) nav.classList.add("scrolled");
                else nav.classList.remove("scrolled");
            }
            if (backToTop) {
                if (scrollY > 400) backToTop.classList.add("visible");
                else backToTop.classList.remove("visible");
            }
        }, 100); // 100ms 节流，每 100ms 最多执行一次

        on(window, "scroll", handleScroll, { passive: true });
        handleScroll();

        if (backToTop) {
            on(backToTop, "click", () => {
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        }
    }

    /* ---------- 3. 滚动入场动画（简化并优化） ---------- */
    function initReveal() {
        const items = $$(".reveal");
        if (!items.length) return;

        // 移动端直接显示，跳过入场动画，减少渲染压力
        if (isMobile()) {
            items.forEach((el) => el.classList.add("in-view"));
            return;
        }

        if (!("IntersectionObserver" in window)) {
            items.forEach((el) => el.classList.add("in-view"));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in-view");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );

        items.forEach((el) => observer.observe(el));
    }

    /* ---------- 4. 开学倒计时 ---------- */
    function initCountdown() {
        const els = {
            days: $("#countdown-days"),
            hours: $("#countdown-hours"),
            minutes: $("#countdown-minutes"),
            seconds: $("#countdown-seconds"),
        };

        if (!els.days && !els.hours && !els.minutes && !els.seconds) return;

        const target = new Date("2026-09-03T00:00:00+08:00").getTime();
        const pad = (n) => n.toString().padStart(2, "0");

        const update = () => {
            const diff = target - Date.now();
            if (diff <= 0) {
                if (els.days) els.days.textContent = "00";
                if (els.hours) els.hours.textContent = "00";
                if (els.minutes) els.minutes.textContent = "00";
                if (els.seconds) els.seconds.textContent = "00";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            if (els.days) els.days.textContent = pad(days);
            if (els.hours) els.hours.textContent = pad(hours);
            if (els.minutes) els.minutes.textContent = pad(minutes);
            if (els.seconds) els.seconds.textContent = pad(seconds);
        };

        update();
        setInterval(update, 1000);
    }

    /* ---------- 5. 访问统计动画 ---------- */
    function initCounterAnimation() {
        const counters = $$("[data-counter]");
        if (!counters.length) return;

        const animate = (el) => {
            const target = parseFloat(el.dataset.counter);
            const duration = 1500; // 缩短一点
            const start = performance.now();
            const isFloat = target % 1 !== 0;

            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                // easeOutCubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = target * eased;
                el.textContent = isFloat ? current.toFixed(2) : Math.floor(current).toString();

                if (progress < 1) requestAnimationFrame(tick);
                else el.textContent = isFloat ? target.toFixed(2) : target.toString();
            };

            requestAnimationFrame(tick);
        };

        // 移动端直接显示最终值，跳过动画
        if (isMobile()) {
            counters.forEach((el) => {
                const target = parseFloat(el.dataset.counter);
                const isFloat = target % 1 !== 0;
                el.textContent = isFloat ? target.toFixed(2) : target.toString();
            });
            return;
        }

        if (!("IntersectionObserver" in window)) {
            counters.forEach(animate);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animate(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );

        counters.forEach((el) => observer.observe(el));
    }

    /* ---------- 6. FAQ 手风琴 ---------- */
    function initFaq() {
        const items = $$(".faq-item");
        if (!items.length) return;

        items.forEach((item) => {
            const q = item.querySelector(".faq-question");
            on(q, "click", () => {
                const isOpen = item.classList.contains("open");
                if (isOpen) item.classList.remove("open");
                else item.classList.add("open");
            });
        });
    }

    /* ---------- 7. 宫格点击反馈 + 跳转 ---------- */
    function initGridItems() {
        const items = $$(".grid-item, .quick-nav-item");
        items.forEach((item) => {
            on(item, "click", (e) => {
                const action = item.dataset.action;
                const title = item.dataset.title || "";
                const href = item.getAttribute("href");

                // 1) 如果有真实外链或文件链接，优先跳转
                if (href && href !== "#") {
                    showToast("正在前往：" + (title || "详情页"));
                    // 让浏览器自然通过 href 打开新标签，同时使用 window.open 兜底
                    setTimeout(() => window.open(href, "_blank", "noopener"), 350);
                    if (e.preventDefault) e.preventDefault();
                    return;
                }

                if (!action) {
                    showToast("即将上线：" + (title || "该功能"));
                    return;
                }

                if (action.startsWith("http")) {
                    e.preventDefault();
                    showToast("正在前往：" + (title || "详情页"));
                    setTimeout(() => window.open(action, "_blank", "noopener"), 400);
                    return;
                }

                if (action.startsWith("#")) {
                    e.preventDefault();
                    const target = document.querySelector(action);
                    if (target) {
                        const navHeight = document.querySelector('.nav-bar')?.offsetHeight || 60;
                        const targetPosition = target.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo({
                            top: targetPosition - navHeight - 15,
                            behavior: "smooth"
                        });
                    }
                    return;
                }

                if (action === "copy") {
                    const text = item.dataset.copyText || "";
                    if (text && navigator.clipboard) {
                        navigator.clipboard.writeText(text).then(() => {
                            showToast("已复制：" + text);
                        }).catch(() => showToast("复制失败"));
                    } else {
                        showToast(text || "无内容");
                    }
                    return;
                }

                showToast(title || "即将上线");
            });
        });
    }

    /* ---------- 8. Banner 粒子（极大优化：移动端禁用；桌面端减少粒子；移除光晕） ---------- */
    function initBannerParticles() {
        const canvas = $("#bannerParticles");
        if (!canvas) return;

        // 移动端直接不显示粒子，避免性能问题
        if (isMobile()) {
            canvas.style.display = "none";
            return;
        }

        // 减少动画偏好（系统设置）
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
            canvas.style.display = "none";
            return;
        }

        const ctx = canvas.getContext("2d");
        let w = 0, h = 0;
        const DPR = Math.min(window.devicePixelRatio || 1, 1.5); // 限制 DPR，避免过度渲染

        const resize = () => {
            w = canvas.clientWidth;
            h = canvas.clientHeight;
            canvas.width = w * DPR;
            canvas.height = h * DPR;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(DPR, DPR);
        };

        resize();
        on(window, "resize", throttle(resize, 300)); // 节流 resize

        // 减少粒子数量，移除光晕（最耗性能的 radial-gradient 已去除）
        const count = Math.max(15, Math.min(35, Math.floor((w * h) / 20000)));
        const particles = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.8 + 0.5,
            vx: (Math.random() - 0.5) * 0.2, // 降低速度
            vy: -Math.random() * 0.25 - 0.05,
            alpha: Math.random() * 0.5 + 0.2,
            color: Math.random() > 0.7 ? "253, 230, 138" : "255, 255, 255",
        }));

        // 页面可见性检测：标签页不可见时暂停绘制
        let isVisible = true;
        on(document, "visibilitychange", () => {
            isVisible = !document.hidden;
            if (isVisible) requestAnimationFrame(render);
        });

        const render = () => {
            if (!isVisible) return; // 标签页隐藏时暂停
            ctx.clearRect(0, 0, w, h);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
                if (p.x < -5) p.x = w + 5;
                if (p.x > w + 5) p.x = -5;

                // 简化绘制：只有实心圆，不再使用 radial-gradient（GPU 大开销）
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
                ctx.fill();
            }

            requestAnimationFrame(render);
        };

        render();
    }

    /* ---------- 9. 当前年份 ---------- */
    function initDynamicDate() {
        const el = $("#currentYear");
        if (el) el.textContent = new Date().getFullYear().toString();
    }

    /* ---------- 10. 新闻列表点击提示（占位） ---------- */
    function initNewsList() {
        const items = $$(".news-item");
        items.forEach((item) => {
            on(item, "click", () => {
                const title = item.querySelector(".news-title")?.textContent.trim();
                showToast("查看详情：" + (title || "最新公告"));
            });
        });
    }

    /* ---------- 入口：DOM 就绪后执行 ---------- */
    function init() {
        initScrollHandlers();    // 合并滚动：导航阴影 + 返回顶部
        initReveal();            // 入场动画（移动端跳过）
        initCountdown();         // 倒计时
        initCounterAnimation();  // 数字动画（移动端跳过动画）
        initFaq();               // FAQ 手风琴
        initGridItems();         // 宫格点击
        initBannerParticles();   // 粒子（移动端禁用）
        initDynamicDate();       // 年份
        initNewsList();          // 新闻
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.YCTUService = { showToast };
})();
