/* ============================================================
   RESOURCES TECHNOLOGIES — Interactions & Sticky Scroll Animations
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const navToggle = document.getElementById('navToggle');
  const mobileDropdown = document.getElementById('mobileDropdown');
  const hamburgerIcon = document.getElementById('hamburgerIcon');
  const closeIcon = document.getElementById('closeIcon');

  if (navToggle && mobileDropdown) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileDropdown.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      if (hamburgerIcon && closeIcon) {
        hamburgerIcon.style.display = isOpen ? 'none' : 'block';
        closeIcon.style.display = isOpen ? 'block' : 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (
        mobileDropdown.classList.contains('is-open') &&
        !navToggle.contains(e.target) &&
        !mobileDropdown.contains(e.target)
      ) {
        mobileDropdown.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        if (hamburgerIcon && closeIcon) {
          hamburgerIcon.style.display = 'block';
          closeIcon.style.display = 'none';
        }
      }
    });
  }

  // Word-by-Word Scroll Reveal for Brand Statement & About Statement
  const revealElements = document.querySelectorAll('#revealText, #aboutStatementText, .scroll-reveal-text');
  const revealHandlers = [];

  revealElements.forEach((el) => {
    const rawText = el.textContent.trim();
    const words = rawText.split(/\s+/);

    el.innerHTML = words
      .map((word) => `<span class="word-span">${word}</span> `)
      .join('');

    const wordSpans = el.querySelectorAll('.word-span');
    const totalWords = wordSpans.length;

    revealHandlers.push({
      el,
      wordSpans,
      totalWords
    });
  });

  function updateWordReveal() {
    if (revealHandlers.length === 0) return;

    const windowHeight = window.innerHeight;

    revealHandlers.forEach(({ el, wordSpans, totalWords }) => {
      const rect = el.getBoundingClientRect();
      const startTrigger = windowHeight * 0.85;
      const endTrigger = windowHeight * 0.35;

      const progress = Math.min(
        Math.max((startTrigger - rect.top) / (startTrigger - endTrigger), 0),
        1
      );

      const wordsToReveal = Math.floor(progress * totalWords);

      wordSpans.forEach((span, index) => {
        if (index <= wordsToReveal) {
          span.classList.add('is-revealed');
        } else {
          span.classList.remove('is-revealed');
        }
      });
    });
  }

  // Sticky Scroll Stacking Animation for Service Spheres
  const sphereCards = document.querySelectorAll('.framer-sphere-card');

  function updateStickySpheres() {
    // Only apply card stacking on desktop screens (>= 1200px)
    if (window.innerWidth < 1200 || sphereCards.length < 2) {
      sphereCards.forEach((card) => {
        card.style.transform = '';
        card.style.opacity = '';
        card.style.filter = '';
      });
      return;
    }

    for (let i = 0; i < sphereCards.length - 1; i++) {
      const currentCard = sphereCards[i];
      const nextCard = sphereCards[i + 1];

      const nextRect = nextCard.getBoundingClientRect();
      const currentStickyTop = 100 + i * 15;
      const nextStickyTop = 100 + (i + 1) * 15;

      // Distance over which the transition occurs (approx 280px of scroll)
      const transitionDistance = 280;
      const startOverlap = nextStickyTop + transitionDistance;
      const endOverlap = nextStickyTop;

      if (nextRect.top <= startOverlap) {
        const overlapProgress = Math.min(
          Math.max((startOverlap - nextRect.top) / (startOverlap - endOverlap), 0),
          1
        );

        // Scale down to 0.95, translateY up by 16px, dim opacity down to 0.4
        const scale = 1 - overlapProgress * 0.05;
        const translateY = -overlapProgress * 16;
        const opacity = 1 - overlapProgress * 0.55;
        const blur = overlapProgress * 1.5;

        currentCard.style.transform = `scale(${scale.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`;
        currentCard.style.opacity = opacity.toFixed(2);
        currentCard.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
      } else {
        currentCard.style.transform = 'scale(1) translateY(0px)';
        currentCard.style.opacity = '1';
        currentCard.style.filter = 'none';
      }
    }
  }

  // Combined smooth scroll loop via requestAnimationFrame
  let isTicking = false;

  function onScroll() {
    updateWordReveal();
    updateStickySpheres();
    isTicking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!isTicking) {
        window.requestAnimationFrame(onScroll);
        isTicking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', () => {
    if (!isTicking) {
      window.requestAnimationFrame(onScroll);
      isTicking = true;
    }
  });

  // Solutions Accordion (Exclusive expand or toggle)
  const solutionCards = document.querySelectorAll('.framer-solution-card');
  if (solutionCards.length > 0) {
    solutionCards.forEach((card) => {
      const header = card.querySelector('.framer-solution-header');
      if (!header) return;

      header.addEventListener('click', () => {
        const isCurrentlyOpen = card.classList.contains('is-open');

        // Close all other cards (exclusive accordion behavior)
        solutionCards.forEach((otherCard) => {
          if (otherCard !== card) {
            otherCard.classList.remove('is-open');
            const otherHeader = otherCard.querySelector('.framer-solution-header');
            if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current card
        if (isCurrentlyOpen) {
          card.classList.remove('is-open');
          header.setAttribute('aria-expanded', 'false');
        } else {
          card.classList.add('is-open');
          header.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // Stats Number Tweening Animation (Scroll-triggered)
  const statBoxes = document.querySelectorAll('.framer-stat-box');
  if (statBoxes.length > 0) {
    let hasAnimated = false;

    function formatValue(val, isComma) {
      if (isComma) {
        return val.toLocaleString('en-US');
      }
      return val.toString();
    }

    function runStatsAnimation() {
      if (hasAnimated) return;
      hasAnimated = true;

      statBoxes.forEach((box) => {
        const numberEl = box.querySelector('.framer-stat-number');
        if (!numberEl) return;

        const target = parseInt(box.getAttribute('data-target'), 10) || 0;
        const suffix = box.getAttribute('data-suffix') || '';
        const isComma = box.getAttribute('data-format') === 'comma';
        const duration = parseInt(box.getAttribute('data-duration'), 10) || 1600;

        let startTime = null;

        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Calibrated ease-out cubic
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentVal = Math.floor(easeProgress * target);

          numberEl.textContent = formatValue(currentVal, isComma) + suffix;

          if (progress < 1) {
            window.requestAnimationFrame(step);
          } else {
            numberEl.textContent = formatValue(target, isComma) + suffix;
          }
        }

        window.requestAnimationFrame(step);
      });
    }

    if ('IntersectionObserver' in window) {
      const statsSection = document.querySelector('.framer-projects-stats-section');
      if (statsSection) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                runStatsAnimation();
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.2 }
        );
        observer.observe(statsSection);
      }
    } else {
      runStatsAnimation();
    }
  }


  // =========================================================================
  // 6. Case Study Image Ticker with Smooth 50% Speed on Hover
  // =========================================================================
  const caseStudyTicker = document.querySelector('.framer-case-study-ticker');
  const caseStudyTrack = document.getElementById('caseStudyTickerTrack');

  if (caseStudyTicker && caseStudyTrack) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      let targetRate = 1.0;
      let currentRate = 1.0;
      let rafId = null;

      const getTickerAnimation = () => {
        const anims = caseStudyTrack.getAnimations();
        return anims.length > 0 ? anims[0] : null;
      };

      const setTickerSpeed = (target) => {
        targetRate = target;
        if (rafId) cancelAnimationFrame(rafId);

        function step() {
          const anim = getTickerAnimation();
          if (!anim) return;

          const diff = targetRate - currentRate;
          if (Math.abs(diff) < 0.01) {
            currentRate = targetRate;
            anim.playbackRate = currentRate;
            rafId = null;
          } else {
            // Smooth natural deceleration / acceleration physics
            currentRate += diff * 0.15;
            anim.playbackRate = currentRate;
            rafId = requestAnimationFrame(step);
          }
        }

        rafId = requestAnimationFrame(step);
      };

      caseStudyTicker.addEventListener('mouseenter', () => {
        setTickerSpeed(0.5); // Reduce speed by 50% on hover
      });

      caseStudyTicker.addEventListener('mouseleave', () => {
        setTickerSpeed(1.0); // Resume 100% normal speed
      });

      // Pointer support for stylus/mouse
      caseStudyTicker.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') setTickerSpeed(0.5);
      });
      caseStudyTicker.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse') setTickerSpeed(1.0);
      });
    }
  }


  // =========================================================================
  // 7. Dynamic CMS Data Hydration for projects.html & case-study.html
  // =========================================================================
  async function fetchCMSProjects() {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) return await res.json();
    } catch (e) {
      // ignore & try static fallback
    }
    try {
      const staticRes = await fetch('data/projects.json');
      if (staticRes.ok) return await staticRes.json();
    } catch (e) {
      console.warn('Failed to load projects from data/projects.json');
    }
    return [];
  }

  // Hydrate index.html homepage projects grid
  const homeGrid = document.getElementById('homeProjectsGrid');
  if (homeGrid) {
    fetchCMSProjects().then((projects) => {
      if (!projects || projects.length === 0) return;
      homeGrid.innerHTML = projects.map((p) => {
        const hero = p.heroImage || 'assets/project-1.png';
        const title = p.title || 'Untitled Project';
        const loc = p.location ? `${p.location}.` : 'Nigeria.';
        const year = p.year || '2026';
        const slug = p.slug || 'mro';

        return `
          <article class="framer-project-card">
            <a href="./case-study.html?slug=${slug}" class="framer-project-img-link" aria-label="${title} Project">
              <div class="framer-project-img-wrapper">
                <img src="${hero}" alt="${title} in ${loc}" width="1024" height="938" loading="lazy" />
              </div>
            </a>
            <div class="framer-project-details">
              <div class="framer-project-info">
                <h3 class="framer-project-name">${title}</h3>
                <div class="framer-project-meta">
                  <span class="framer-project-location">${loc}</span>
                  <img src="assets/icon-star.svg" alt="" width="12" height="12" class="framer-project-star" aria-hidden="true" />
                  <span class="framer-project-year">${year}</span>
                </div>
              </div>
              <a href="./case-study.html?slug=${slug}" class="framer-project-cta" aria-label="View ${title} Project">
                <span>View Project</span>
                <img src="assets/icon-arrow-right.svg" alt="" width="16" height="16" aria-hidden="true" />
              </a>
            </div>
          </article>
        `;
      }).join('');
    });
  }

  // Hydrate projects.html grid
  const showcaseGrid = document.getElementById('projectsShowcaseGrid');
  if (showcaseGrid) {
    fetchCMSProjects().then((projects) => {
      if (!projects || projects.length === 0) return;
      showcaseGrid.innerHTML = projects.map((p) => {
        const hero = p.heroImage || 'assets/project-1.png';
        const title = p.title || 'Untitled Project';
        const loc = p.location ? `${p.location}.` : 'Nigeria.';
        const year = p.year || '2026';
        const slug = p.slug || 'mro';

        return `
          <article class="framer-project-item">
            <div class="framer-project-item__img-wrap">
              <img src="${hero}" alt="${title} in ${loc}" width="1024" height="938" loading="lazy" />
            </div>
            <div class="framer-project-item__details">
              <div class="framer-project-item__info">
                <h2 class="framer-project-item__title">${title}</h2>
                <div class="framer-project-item__meta">
                  <span class="framer-project-item__loc">${loc}</span>
                  <span class="framer-project-item__star" aria-hidden="true">✦</span>
                  <span class="framer-project-item__year">${year}</span>
                </div>
              </div>
              <a href="./case-study.html?slug=${slug}" class="framer-project-item__link" aria-label="View ${title} Project">
                <span>View Project</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
            </div>
          </article>
        `;
      }).join('');
    });
  }

  // Hydrate case-study.html content dynamically based on ?slug=...
  const csTitleEl = document.getElementById('csHeroTitle');
  if (csTitleEl) {
    const params = new URLSearchParams(window.location.search);
    const targetSlug = params.get('slug') || params.get('project');

    fetchCMSProjects().then((projects) => {
      if (!projects || projects.length === 0) return;
      let project = null;
      if (targetSlug) {
        project = projects.find((p) => p.slug === targetSlug || p.id === targetSlug);
      }
      // Default to first project if slug not matched or not provided
      if (!project) project = projects[0];

      // 1. Meta / Document Title
      document.title = `${project.title} — Case Study | Resources Tech. System Ltd`;

      // 2. Hero Card Fields
      const heroImg = document.getElementById('csHeroImg');
      if (heroImg && project.heroImage) {
        heroImg.src = project.heroImage;
        heroImg.alt = `${project.title} Facility`;
      }
      csTitleEl.textContent = project.title;

      const heroType = document.getElementById('csHeroType');
      if (heroType) heroType.textContent = project.type || 'Infrastructure';

      const heroLoc = document.getElementById('csHeroLocation');
      if (heroLoc) heroLoc.textContent = project.location || 'Nigeria';

      // 3. Project Overview
      const overviewWrap = document.getElementById('csOverviewWrap');
      if (overviewWrap && project.overview) {
        const paragraphs = Array.isArray(project.overview) ? project.overview : [project.overview];
        overviewWrap.innerHTML = paragraphs.map((text) => `<p class="framer-case-study-p">${text}</p>`).join('');
      }

      // 4. Systems Implemented
      const systemsList = document.getElementById('csSystemsList');
      if (systemsList && project.systems) {
        const systems = Array.isArray(project.systems) ? project.systems : [project.systems];
        systemsList.innerHTML = systems.map((sys) => `<li>${sys}</li>`).join('');
      }

      // 5. Engineering Approach
      const approachList = document.getElementById('csApproachList');
      if (approachList && project.approach) {
        const steps = Array.isArray(project.approach) ? project.approach : [project.approach];
        approachList.innerHTML = steps.map((step) => `<li>${step}</li>`).join('');
      }

      // 6. Delivery & Outcome
      const outcomeWrap = document.getElementById('csOutcomeWrap');
      if (outcomeWrap && project.outcome) {
        outcomeWrap.innerHTML = `<p class="framer-case-study-p">${project.outcome}</p>`;
      }

      // 7. Why This Project Matters
      const whyMattersWrap = document.getElementById('csWhyMattersWrap');
      if (whyMattersWrap && project.whyMatters) {
        whyMattersWrap.innerHTML = `<p class="framer-case-study-p">${project.whyMatters}</p>`;
      }

      // 8. Gallery Ticker Images
      const tickerTrack = document.getElementById('caseStudyTickerTrack');
      if (tickerTrack && project.gallery && project.gallery.length > 0) {
        const galleryItems = Array.isArray(project.gallery) ? project.gallery : [project.gallery];
        const group1Html = galleryItems.map((src) => `
          <div class="framer-case-study-gallery-item">
            <img src="${src}" alt="Installation detail" width="1086" height="1448" loading="lazy" />
          </div>
        `).join('');

        const group2Html = galleryItems.map((src) => `
          <div class="framer-case-study-gallery-item" aria-hidden="true">
            <img src="${src}" alt="" width="1086" height="1448" loading="lazy" />
          </div>
        `).join('');

        tickerTrack.innerHTML = `
          <div class="framer-case-study-ticker-group">${group1Html}</div>
          <div class="framer-case-study-ticker-group" aria-hidden="true">${group2Html}</div>
        `;
      }
    });
  }

  // Run once on initial load
  onScroll();
});
