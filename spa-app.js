// Jacky Spa Days App - JavaScript Logic
class SpaApp {
  constructor() {
    this.data = this.loadData();
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateUI();
    this.setupServiceWorker();
  }

  // Data Management
  loadData() {
    const defaultData = {
      stars: 0,
      totalEarned: 0,
      visits: [],
      vouchers: [],
      streakWeeks: 0,
      lastVisitAt: null,
      dailyAwarded: 0,
      lastAwardDate: null,
      settings: {
        sounds: true,
        haptics: true,
        animations: true,
      },
    };

    try {
      const saved = localStorage.getItem("spa-app-data");
      return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    } catch (e) {
      console.error("Error loading data:", e);
      return defaultData;
    }
  }

  saveData() {
    try {
      localStorage.setItem("spa-app-data", JSON.stringify(this.data));
    } catch (e) {
      console.error("Error saving data:", e);
    }
  }

  // Services and Rewards Configuration
  getServices() {
    return [
      {
        id: "nail-session",
        name: "Nail Session (full set)",
        icon: "💅",
        stars: 250,
      },
      { id: "nail-fill", name: "Nail Fill / Touch-up", icon: "💅", stars: 150 },
      { id: "massage", name: "Massage (30m)", icon: "💆‍♀️", stars: 200 },
      { id: "bubble-bath", name: "Bubble Bath Setup", icon: "🛁", stars: 150 },
      { id: "face-mask", name: "Face Mask Treatment", icon: "🧴", stars: 125 },
      {
        id: "ambience",
        name: "Candlelight / Ambience Pack",
        icon: "🕯️",
        stars: 75,
      },
      { id: "snack-tea", name: "Snack / Tea Service", icon: "🍵", stars: 75 },
      { id: "surprise", name: "Surprise Gesture", icon: "🎁", stars: 125 },
    ];
  }

  getRewards() {
    return [
      { id: "cute-addon", name: "Cute Add-On", cost: 625 },
      { id: "theme-night", name: "Theme Night", cost: 1250 },
      { id: "pamper-pack", name: "Full Pamper Pack", cost: 1875 },
      { id: "royal-treatment", name: "Royal Treatment", cost: 2500 },
    ];
  }

  // UI Updates
  updateUI() {
    this.updateStarDisplay();
    this.updateProgressRing();
    this.updateDailyCap();
    this.updateRewards();
    this.updateHistory();
    this.updateProfile();
    this.updateLastVisit();
  }

  updateStarDisplay() {
    const starCount = document.getElementById("star-count");
    const starText = document.getElementById("star-text");

    if (starCount) starCount.textContent = this.data.stars.toLocaleString();
    if (starText) starText.textContent = this.data.stars.toLocaleString();
  }

  updateProgressRing() {
    const rewards = this.getRewards();
    const progressCircle = document.getElementById("progress-circle");
    const progressInner = document.getElementById("progress-inner");

    if (!progressCircle || !progressInner) return;

    const nextReward = rewards.find((r) => r.cost > this.data.stars);

    if (nextReward) {
      const progress = (this.data.stars / nextReward.cost) * 100;
      const angle = (progress / 100) * 360;

      progressCircle.style.setProperty("--progress-angle", `${angle}deg`);
      progressInner.innerHTML = `${
        nextReward.cost - this.data.stars
      }<br>⭐ to<br>${nextReward.name}`;
    } else {
      progressCircle.style.setProperty("--progress-angle", "360deg");
      progressInner.innerHTML = "All rewards<br>unlocked!";
    }
  }

  updateDailyCap() {
    const banner = document.getElementById("daily-cap-banner");
    const today = new Date().toDateString();
    const isToday = this.data.lastAwardDate === today;

    if (banner) {
      if (isToday && this.data.dailyAwarded >= 625) {
        banner.classList.remove("hidden");
      } else {
        banner.classList.add("hidden");
      }
    }
  }

  updateRewards() {
    const rewardsGrid = document.getElementById("rewards-grid");
    if (!rewardsGrid) return;

    const rewards = this.getRewards();
    rewardsGrid.innerHTML = rewards
      .map((reward) => {
        const canAfford = this.data.stars >= reward.cost;
        const progress = Math.min((this.data.stars / reward.cost) * 100, 100);

        return `
                <div class="service-item" style="flex-direction: column; align-items: stretch;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <div class="service-name">${reward.name}</div>
                            <div class="service-stars">${reward.cost} ⭐</div>
                        </div>
                        <button class="stepper-btn ${
                          canAfford ? "" : "disabled"
                        }" 
                                onclick="spaApp.redeemReward('${reward.id}')"
                                ${!canAfford ? "disabled" : ""}>
                            ${canAfford ? "✓" : "×"}
                        </button>
                    </div>
                    <div style="width: 100%; height: 4px; background: var(--bg-primary); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background: var(--accent-pink); transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  updateHistory() {
    const historyList = document.getElementById("history-list");
    if (!historyList) return;

    if (this.data.visits.length === 0) {
      historyList.innerHTML =
        '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">No visits yet</div>';
      return;
    }

    historyList.innerHTML = this.data.visits
      .slice(-10)
      .reverse()
      .map((visit) => {
        const date = new Date(visit.date).toLocaleDateString();
        const serviceCount = visit.services.length;

        return `
                <div class="service-item">
                    <div class="service-info">
                        <span class="service-icon">📅</span>
                        <div>
                            <div class="service-name">${date}</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                                ${serviceCount} service${
          serviceCount !== 1 ? "s" : ""
        }
                            </div>
                        </div>
                    </div>
                    <div class="service-stars">+${visit.awardedStars} ⭐</div>
                </div>
            `;
      })
      .join("");
  }

  updateProfile() {
    const totalEarned = document.getElementById("total-earned");
    const totalVisits = document.getElementById("total-visits");
    const currentStreak = document.getElementById("current-streak");

    if (totalEarned)
      totalEarned.textContent = `${this.data.totalEarned.toLocaleString()} ⭐`;
    if (totalVisits)
      totalVisits.textContent = this.data.visits.length.toString();
    if (currentStreak)
      currentStreak.textContent = `${this.data.streakWeeks} weeks`;
  }

  updateLastVisit() {
    const lastVisit = document.getElementById("last-visit");
    if (!lastVisit) return;

    if (this.data.visits.length === 0) {
      lastVisit.textContent = "No visits yet";
      return;
    }

    const latest = this.data.visits[this.data.visits.length - 1];
    const date = new Date(latest.date).toLocaleDateString();
    lastVisit.textContent = `${date} • ${latest.services.length} services • +${latest.awardedStars} ⭐`;
  }

  // Event Handlers
  bindEvents() {
    // Tab navigation
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const screen = e.currentTarget.getAttribute("data-screen");
        this.switchScreen(screen);
      });
    });

    // Start visit button
    const startVisitBtn = document.getElementById("start-visit-btn");
    if (startVisitBtn) {
      startVisitBtn.addEventListener("click", () => this.openStartVisitModal());
    }

    // Award stars button
    const awardBtn = document.getElementById("award-stars-btn");
    if (awardBtn) {
      awardBtn.addEventListener("click", () => this.awardStars());
    }

    // Modal close on overlay click
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        this.closeModal();
      }
    });

    // Service selection
    this.bindServiceEvents();
    this.bindBonusEvents();
    this.bindShortcuts();
  }

  bindServiceEvents() {
    // This will be called when the modal is opened to bind events to dynamically created elements
    setTimeout(() => {
      document
        .querySelectorAll(".service-item[data-service]")
        .forEach((item) => {
          item.addEventListener("click", () => {
            item.classList.toggle("selected");
            this.updateLiveTotal();
          });
        });
    }, 100);
  }

  bindBonusEvents() {
    // Switch toggles
    document.querySelectorAll(".switch").forEach((switchEl) => {
      switchEl.addEventListener("click", () => {
        switchEl.classList.toggle("active");
        this.updateLiveTotal();
      });
    });

    // Photo stepper
    const photoMinus = document.getElementById("photo-minus");
    const photoPlus = document.getElementById("photo-plus");
    const photoCount = document.getElementById("photo-count");

    if (photoMinus && photoPlus && photoCount) {
      photoMinus.addEventListener("click", () => {
        const current = parseInt(photoCount.textContent) || 0;
        if (current > 0) {
          photoCount.textContent = (current - 1).toString();
          this.updateLiveTotal();
        }
      });

      photoPlus.addEventListener("click", () => {
        const current = parseInt(photoCount.textContent) || 0;
        photoCount.textContent = (current + 1).toString();
        this.updateLiveTotal();
      });
    }
  }

  bindShortcuts() {
    document.querySelectorAll(".shortcut-chip").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        const serviceId = e.currentTarget.getAttribute("data-service");
        this.quickAwardService(serviceId);
      });
    });
  }

  // Screen Navigation
  switchScreen(screenName) {
    // Update tab buttons
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector(`[data-screen="${screenName}"]`)
      .classList.add("active");

    // Update screens
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
    });
    document.getElementById(`${screenName}-screen`).classList.add("active");
  }

  // Modal Management
  openStartVisitModal() {
    const modal = document.getElementById("start-visit-modal");
    const serviceList = document.getElementById("service-list");
    const visitDate = document.getElementById("visit-date");

    if (!modal || !serviceList) return;

    // Set date
    if (visitDate) {
      visitDate.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Populate services
    const services = this.getServices();
    serviceList.innerHTML = services
      .map(
        (service) => `
            <li class="service-item" data-service="${service.id}">
                <div class="service-info">
                    <span class="service-icon">${service.icon}</span>
                    <div class="service-name">${service.name}</div>
                </div>
                <div class="service-stars">${service.stars} ⭐</div>
            </li>
        `
      )
      .join("");

    // Reset bonuses
    document
      .querySelectorAll(".switch")
      .forEach((s) => s.classList.remove("active"));
    const photoCount = document.getElementById("photo-count");
    if (photoCount) photoCount.textContent = "0";

    // Show modal
    modal.classList.add("active");

    // Rebind events for new elements
    this.bindServiceEvents();
    this.updateLiveTotal();
  }

  closeModal() {
    document.querySelectorAll(".modal-overlay").forEach((modal) => {
      modal.classList.remove("active");
    });
  }

  // Visit Logic
  updateLiveTotal() {
    const liveTotal = document.getElementById("live-total");
    if (!liveTotal) return;

    const selectedServices = Array.from(
      document.querySelectorAll(".service-item.selected[data-service]")
    );
    const services = this.getServices();

    // Calculate base stars
    let total = selectedServices.reduce((sum, item) => {
      const serviceId = item.getAttribute("data-service");
      const service = services.find((s) => s.id === serviceId);
      return sum + (service ? service.stars : 0);
    }, 0);

    // Add combo bonus
    const serviceCount = selectedServices.length;
    if (serviceCount >= 2) total += 25;
    if (serviceCount >= 3) total += 50;
    if (serviceCount >= 4) total += 75;

    // Add bonuses
    if (
      document.getElementById("aesthetic-switch")?.classList.contains("active")
    ) {
      total += 50;
    }
    if (
      document
        .getElementById("perfect-prep-switch")
        ?.classList.contains("active")
    ) {
      total += 75;
    }

    // Add photo bonus
    const photoCount = parseInt(
      document.getElementById("photo-count")?.textContent || "0"
    );
    if (photoCount >= 3) {
      total += 50;
    } else if (photoCount >= 1) {
      total += 50;
    }

    // Check for first of month multiplier
    const today = new Date();
    if (today.getDate() === 1) {
      total = Math.round(total * 1.25);
    }

    liveTotal.textContent = `${total} ⭐`;
  }

  quickAwardService(serviceId) {
    const services = this.getServices();
    const service = services.find((s) => s.id === serviceId);

    if (service) {
      const stars = service.stars;
      this.awardStarsAmount(stars, [serviceId], {});
      this.showToast(`✨ +${stars}⭐ ${service.name.toLowerCase()}`);
    }
  }

  awardStars() {
    const selectedServices = Array.from(
      document.querySelectorAll(".service-item.selected[data-service]")
    ).map((item) => item.getAttribute("data-service"));

    if (selectedServices.length === 0) {
      this.showToast("Please select at least one service");
      return;
    }

    const services = this.getServices();

    // Calculate total (same logic as updateLiveTotal)
    let total = selectedServices.reduce((sum, serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return sum + (service ? service.stars : 0);
    }, 0);

    // Add combo bonus
    const serviceCount = selectedServices.length;
    if (serviceCount >= 2) total += 25;
    if (serviceCount >= 3) total += 50;
    if (serviceCount >= 4) total += 75;

    // Bonuses
    const bonuses = {};
    if (
      document.getElementById("aesthetic-switch")?.classList.contains("active")
    ) {
      total += 50;
      bonuses.aestheticMatch = true;
    }
    if (
      document
        .getElementById("perfect-prep-switch")
        ?.classList.contains("active")
    ) {
      total += 75;
      bonuses.perfectPrep = true;
    }

    const photoCount = parseInt(
      document.getElementById("photo-count")?.textContent || "0"
    );
    if (photoCount >= 3) {
      total += 50;
      bonuses.photos = photoCount;
    } else if (photoCount >= 1) {
      total += 50;
      bonuses.photos = photoCount;
    }

    // First of month multiplier
    const today = new Date();
    if (today.getDate() === 1) {
      total = Math.round(total * 1.25);
      bonuses.firstOfMonth = true;
    }

    // Lucky glitter (1% chance)
    if (Math.random() < 0.01) {
      total += 75;
      bonuses.luckyGlitter = true;
    }

    this.awardStarsAmount(total, selectedServices, bonuses);
    this.closeModal();
  }

  awardStarsAmount(amount, services, bonuses) {
    const today = new Date().toDateString();

    // Check daily cap
    if (this.data.lastAwardDate !== today) {
      this.data.dailyAwarded = 0;
    }

    const remainingCap = 625 - this.data.dailyAwarded;
    const actualAwarded = Math.min(amount, remainingCap);

    // Update data
    this.data.stars += actualAwarded;
    this.data.totalEarned += actualAwarded;
    this.data.dailyAwarded += actualAwarded;
    this.data.lastAwardDate = today;

    // Add visit record
    this.data.visits.push({
      id: Date.now(),
      date: new Date().toISOString(),
      services: services,
      bonuses: bonuses,
      awardedStars: actualAwarded,
      notes: "",
    });

    // Update streak
    this.updateStreak();

    this.saveData();
    this.updateUI();

    // Show effects
    this.showStarBurst();
    this.showToast(`+${actualAwarded} ⭐ awarded!`);

    if (bonuses.luckyGlitter) {
      setTimeout(() => this.showToast("🍀 Lucky Glitter! +75 ⭐"), 1000);
    }
  }

  updateStreak() {
    // Simple streak logic: one visit this week counts
    const now = new Date();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay()
    );

    const hasVisitThisWeek = this.data.visits.some((visit) => {
      const visitDate = new Date(visit.date);
      return visitDate >= startOfWeek;
    });

    if (hasVisitThisWeek) {
      // This is simplified - a real implementation would track consecutive weeks
      this.data.streakWeeks = Math.max(this.data.streakWeeks, 1);
    }
  }

  // Rewards
  redeemReward(rewardId) {
    const rewards = this.getRewards();
    const reward = rewards.find((r) => r.id === rewardId);

    if (!reward || this.data.stars < reward.cost) {
      this.showToast("Not enough stars!");
      return;
    }

    // Deduct stars
    this.data.stars -= reward.cost;

    // Create voucher
    const voucher = {
      id: Date.now(),
      rewardId: reward.id,
      rewardName: reward.name,
      status: "active",
      issuedAt: new Date().toISOString(),
      expiresAt: null,
    };

    this.data.vouchers.push(voucher);

    this.saveData();
    this.updateUI();

    this.showToast(`🎁 ${reward.name} voucher created!`);
  }

  // Visual Effects
  showStarBurst() {
    const burst = document.createElement("div");
    burst.className = "star-burst";
    burst.style.left = "50%";
    burst.style.top = "30%";

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement("div");
      particle.className = "star-particle";
      particle.textContent = "⭐";
      particle.style.left = Math.random() * 40 - 20 + "px";
      particle.style.top = Math.random() * 40 - 20 + "px";
      particle.style.animationDelay = Math.random() * 0.3 + "s";
      burst.appendChild(particle);
    }

    document.body.appendChild(burst);

    setTimeout(() => {
      document.body.removeChild(burst);
    }, 1500);
  }

  showToast(message) {
    // Create toast notification
    const toast = document.createElement("div");
    toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 12px;
            box-shadow: var(--shadow);
            z-index: 3000;
            animation: slideDown 0.3s ease-out;
        `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideUp 0.3s ease-out forwards";
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  // PWA Setup
  setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("./sw.js")
        .then((registration) => {
          console.log("ServiceWorker registered:", registration);
        })
        .catch((error) => {
          console.log("ServiceWorker registration failed:", error);
        });
    }
  }
}

// Add CSS animations for toast
const style = document.createElement("style");
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize app
const spaApp = new SpaApp();

// Prevent zoom on double tap (iOS)
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  function (event) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);

// Add haptic feedback on iOS
function hapticFeedback(style = "light") {
  if (window.navigator && window.navigator.vibrate) {
    switch (style) {
      case "light":
        window.navigator.vibrate(10);
        break;
      case "medium":
        window.navigator.vibrate(20);
        break;
      case "heavy":
        window.navigator.vibrate([30, 10, 30]);
        break;
    }
  }
}

// Add haptic to button clicks
document.addEventListener("click", function (e) {
  if (e.target.matches("button, .shortcut-chip, .service-item, .switch")) {
    hapticFeedback("light");
  }
});
