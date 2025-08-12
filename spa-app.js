// Jacky Spa Days App - JavaScript Logic
class SpaApp {
  constructor() {
    this.data = this.loadData();
    this.init();
  }

  init() {
    this.checkDailyReset();
    this.updateLoginStreak();
    this.bindEvents();
    this.updateUI();
    this.setupServiceWorker();
    this.showWelcomeIfNeeded();
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
      // Daily bonus system
      dailyBonusClaimed: false,
      lastDailyBonusDate: null,
      loginStreak: 0,
      lastLoginDate: null,
      totalLoginDays: 0,
      isFirstVisit: true,
      // Weekly challenges
      weeklyProgress: {
        visits: 0,
        starsEarned: 0,
        servicesUsed: new Set(),
        weekStart: null,
      },
      settings: {
        sounds: true,
        haptics: true,
        animations: true,
      },
    };

    try {
      const saved = localStorage.getItem("spa-app-data");
      if (saved) {
        const parsedData = { ...defaultData, ...JSON.parse(saved) };
        // Convert Array back to Set for servicesUsed
        if (
          parsedData.weeklyProgress &&
          parsedData.weeklyProgress.servicesUsed
        ) {
          parsedData.weeklyProgress.servicesUsed = new Set(
            parsedData.weeklyProgress.servicesUsed
          );
        }
        return parsedData;
      }
      return defaultData;
    } catch (e) {
      console.error("Error loading data:", e);
      return defaultData;
    }
  }

  saveData() {
    try {
      // Convert Set to Array for JSON serialization
      const dataToSave = {
        ...this.data,
        weeklyProgress: {
          ...this.data.weeklyProgress,
          servicesUsed: Array.from(this.data.weeklyProgress.servicesUsed || []),
        },
      };
      localStorage.setItem("spa-app-data", JSON.stringify(dataToSave));
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

  // Daily Bonus System
  checkDailyReset() {
    const today = new Date().toDateString();

    // Reset daily bonus if it's a new day
    if (this.data.lastDailyBonusDate !== today) {
      this.data.dailyBonusClaimed = false;
    }

    // Reset weekly challenges if it's a new week
    const now = new Date();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay()
    );
    const weekStartStr = weekStart.toDateString();

    if (this.data.weeklyProgress.weekStart !== weekStartStr) {
      this.data.weeklyProgress = {
        visits: 0,
        starsEarned: 0,
        servicesUsed: new Set(),
        weekStart: weekStartStr,
      };
    }
  }

  updateLoginStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (this.data.lastLoginDate === today) {
      // Already logged in today, no change
      return;
    }

    if (this.data.lastLoginDate === yesterdayStr) {
      // Consecutive day login
      this.data.loginStreak += 1;
    } else if (
      this.data.lastLoginDate === null ||
      this.data.lastLoginDate !== yesterdayStr
    ) {
      // First login or streak broken
      this.data.loginStreak = 1;
    }

    this.data.lastLoginDate = today;
    this.data.totalLoginDays += 1;
    this.saveData();
  }

  getDailyBonusAmount() {
    const baseBonus = 50;
    const streakMultiplier = Math.min(this.data.loginStreak * 0.1, 2.0); // Max 2x multiplier
    return Math.floor(baseBonus + baseBonus * streakMultiplier);
  }

  claimDailyBonus() {
    if (this.data.dailyBonusClaimed) {
      this.showToast("Daily bonus already claimed!");
      return;
    }

    const bonusAmount = this.getDailyBonusAmount();
    this.data.stars += bonusAmount;
    this.data.totalEarned += bonusAmount;
    this.data.dailyBonusClaimed = true;
    this.data.lastDailyBonusDate = new Date().toDateString();

    this.saveData();
    this.updateUI();
    this.showStarBurst();
    this.showToast(`🎁 Daily bonus claimed! +${bonusAmount} ⭐`);
  }

  getStreakRewards() {
    return [
      {
        days: 3,
        reward: "🌟 Star Multiplier ×1.2",
        claimed: this.data.loginStreak >= 3,
      },
      { days: 7, reward: "+100 ⭐ Bonus", claimed: this.data.loginStreak >= 7 },
      {
        days: 14,
        reward: "🎁 Free Cute Add-On",
        claimed: this.data.loginStreak >= 14,
      },
      {
        days: 30,
        reward: "👑 VIP Status",
        claimed: this.data.loginStreak >= 30,
      },
    ];
  }

  getWeeklyChallenges() {
    const challenges = [
      {
        id: "visits",
        name: "Complete 5 Spa Visits",
        description: "Book and complete 5 spa visits this week",
        progress: this.data.weeklyProgress.visits,
        target: 5,
        reward: 150,
        icon: "🏆",
      },
      {
        id: "stars",
        name: "Earn 1000 Stars",
        description: "Accumulate 1000 stars this week",
        progress: this.data.weeklyProgress.starsEarned,
        target: 1000,
        reward: 200,
        icon: "⭐",
      },
      {
        id: "services",
        name: "Try 6 Different Services",
        description: "Use 6 different types of services",
        progress: this.data.weeklyProgress.servicesUsed.size || 0,
        target: 6,
        reward: 175,
        icon: "🎯",
      },
    ];

    return challenges;
  }

  // Welcome System
  showWelcomeIfNeeded() {
    // Show welcome message for first-time users or returning users after a long break
    const shouldShowWelcome = this.data.isFirstVisit || this.isReturningUser();

    if (shouldShowWelcome) {
      setTimeout(() => {
        this.showWelcomeMessage();
      }, 1000); // Show after 1 second to let the app load
    }
  }

  isReturningUser() {
    if (!this.data.lastLoginDate) return false;

    const lastLogin = new Date(this.data.lastLoginDate);
    const now = new Date();
    const daysDiff = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));

    // Show welcome if user hasn't logged in for 7+ days
    return daysDiff >= 7;
  }

  showWelcomeMessage() {
    const welcomeOverlay = document.getElementById("welcome-overlay");
    const continueBtn = document.getElementById("welcome-continue-btn");

    if (welcomeOverlay) {
      // Update welcome message based on user state
      this.updateWelcomeContent();

      welcomeOverlay.classList.add("active");

      // Add sparkle effect
      this.addWelcomeSparkles();

      // Bind continue button
      if (continueBtn) {
        continueBtn.addEventListener("click", () => {
          this.hideWelcomeMessage();
        });
      }

      // Auto-hide after 10 seconds if user doesn't interact
      setTimeout(() => {
        if (welcomeOverlay.classList.contains("active")) {
          this.hideWelcomeMessage();
        }
      }, 10000);

      // Mark as not first visit
      this.data.isFirstVisit = false;
      this.saveData();
    }
  }

  updateWelcomeContent() {
    const titleEl = document.querySelector(".welcome-title");
    const subtitleEl = document.querySelector(".welcome-subtitle");
    const messageEl = document.querySelector(".welcome-message");
    const buttonEl = document.querySelector(".welcome-button");

    if (!titleEl || !subtitleEl || !messageEl || !buttonEl) return;

    let title = "Welcome Jacky!";
    let subtitle = "✨ Ready for Your Spa Day? ✨";
    let message =
      "Your luxurious spa experience awaits! Track your visits, earn sparkling stars, and unlock amazing rewards. Let's make today absolutely beautiful! 💅✨";
    let buttonText = "Start Sparkling";

    if (this.data.isFirstVisit) {
      title = "Welcome to Jacky Spa Days!";
      subtitle = "✨ Your Sparkling Journey Begins! ✨";
      message =
        "Welcome to your personal spa tracking paradise! Earn stars for every treatment, unlock fabulous rewards, and track your glow-up journey. Ready to sparkle? 💎✨";
      buttonText = "Begin My Journey";
    } else if (this.isReturningUser()) {
      title = "Welcome Back, Jacky!";
      subtitle = `🌟 We Missed You! (${this.data.loginStreak} day streak) 🌟`;
      message = `So excited to see you again! You've earned ${this.data.totalEarned.toLocaleString()} stars total and completed ${
        this.data.visits.length
      } spa visits. Ready for another fabulous session? 💅✨`;
      buttonText = "Continue Sparkling";
    } else if (this.data.loginStreak >= 7) {
      title = "Sparkling Streak Queen!";
      subtitle = `🔥 ${this.data.loginStreak} Day Streak! You're on fire! 🔥`;
      message = `Absolutely incredible! Your ${this.data.loginStreak}-day streak is absolutely stunning! Keep this amazing momentum going and earn even more fabulous rewards! 👑✨`;
      buttonText = "Keep Sparkling";
    }

    titleEl.textContent = title;
    subtitleEl.textContent = subtitle;
    messageEl.textContent = message;
    buttonEl.textContent = buttonText;
  }

  hideWelcomeMessage() {
    const welcomeOverlay = document.getElementById("welcome-overlay");
    if (welcomeOverlay) {
      welcomeOverlay.style.animation = "welcomeFadeOut 0.3s ease-out forwards";
      setTimeout(() => {
        welcomeOverlay.classList.remove("active");
        welcomeOverlay.style.animation = "";
      }, 300);
    }
  }

  addWelcomeSparkles() {
    // Add dynamic sparkles around the welcome message
    const sparklesContainer = document.querySelector(".welcome-sparkles");
    if (!sparklesContainer) return;

    const sparkleEmojis = ["✨", "⭐", "💎", "🌟", "💫", "🎀", "💅", "🦋"];

    // Add 8 more random sparkles
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const sparkle = document.createElement("div");
        sparkle.className = "sparkle";
        sparkle.textContent =
          sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
        sparkle.style.top = Math.random() * 80 + 10 + "%";
        sparkle.style.left = Math.random() * 80 + 10 + "%";
        sparkle.style.animationDelay = Math.random() * 2 + "s";
        sparkle.style.animationDuration = Math.random() * 2 + 3 + "s";

        sparklesContainer.appendChild(sparkle);

        // Remove sparkle after animation
        setTimeout(() => {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        }, 5000);
      }, i * 200);
    }
  }

  // UI Updates
  updateUI() {
    this.updateStarDisplay();
    this.updateProgressRing();
    this.updateDailyCap();
    this.updateDailyBonus();
    this.updateRewards();
    this.updateHistory();
    this.updateProfile();
    this.updateLastVisit();
    this.updateDailyScreen();
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

  updateDailyBonus() {
    const dailyBonusCard = document.getElementById("daily-bonus-card");
    if (!dailyBonusCard) return;

    if (this.data.dailyBonusClaimed) {
      dailyBonusCard.classList.add("daily-bonus-claimed");
      dailyBonusCard.style.display = "none"; // Hide if already claimed
    } else {
      dailyBonusCard.classList.remove("daily-bonus-claimed");
      dailyBonusCard.style.display = "flex";
    }
  }

  updateDailyScreen() {
    this.updateDailyBonusMain();
    this.updateStreakProgress();
    this.updateStreakRewards();
    this.updateWeeklyChallenges();
  }

  updateDailyBonusMain() {
    const dailyBonusMain = document.getElementById("daily-bonus-main");
    const dailyBonusIcon = document.getElementById("daily-bonus-icon");
    const dailyBonusTitle = document.getElementById("daily-bonus-title");
    const dailyBonusDesc = document.getElementById("daily-bonus-desc");
    const dailyBonusStars = document.getElementById("daily-bonus-stars");
    const claimBtn = document.getElementById("claim-daily-main-btn");

    if (!dailyBonusMain) return;

    const bonusAmount = this.getDailyBonusAmount();

    if (this.data.dailyBonusClaimed) {
      dailyBonusMain.classList.add("daily-bonus-claimed");
      dailyBonusIcon.textContent = "✅";
      dailyBonusTitle.textContent = "Daily Bonus Claimed";
      dailyBonusDesc.textContent = "Come back tomorrow for another bonus!";
      dailyBonusStars.textContent = `+${bonusAmount} ⭐`;
      claimBtn.style.display = "none";
    } else {
      dailyBonusMain.classList.remove("daily-bonus-claimed");
      dailyBonusIcon.textContent = "🎁";
      dailyBonusTitle.textContent = "Daily Bonus Available";
      dailyBonusDesc.textContent = `Streak bonus: +${Math.floor(
        bonusAmount - 50
      )} ⭐`;
      dailyBonusStars.textContent = `+${bonusAmount} ⭐`;
      claimBtn.style.display = "flex";
    }
  }

  updateStreakProgress() {
    const loginStreakDays = document.getElementById("login-streak-days");
    const streakMultiplier = document.getElementById("streak-multiplier");
    const streakProgressText = document.getElementById("streak-progress-text");
    const streakProgressBar = document.getElementById("streak-progress-bar");

    if (loginStreakDays)
      loginStreakDays.textContent = `${this.data.loginStreak} days`;
    if (streakMultiplier) {
      const multiplier = 1 + Math.min(this.data.loginStreak * 0.1, 2.0);
      streakMultiplier.textContent = `×${multiplier.toFixed(1)}`;
    }

    const nextMilestone = this.getStreakRewards().find(
      (r) => r.days > this.data.loginStreak
    );
    const targetDays = nextMilestone ? nextMilestone.days : 30;
    const progress = Math.min((this.data.loginStreak / targetDays) * 100, 100);

    if (streakProgressText)
      streakProgressText.textContent = `${this.data.loginStreak}/${targetDays} days`;
    if (streakProgressBar) streakProgressBar.style.width = `${progress}%`;
  }

  updateStreakRewards() {
    const streakRewardsList = document.getElementById("streak-rewards-list");
    if (!streakRewardsList) return;

    const rewards = this.getStreakRewards();
    streakRewardsList.innerHTML = rewards
      .map((reward) => {
        const isCompleted = reward.claimed;
        const isAvailable =
          this.data.loginStreak >= reward.days && !isCompleted;

        return `
        <div class="streak-reward-item ${isCompleted ? "completed" : ""} ${
          isAvailable ? "available" : ""
        }">
          <div>
            <div style="font-weight: 500;">${reward.days} Days</div>
            <div style="font-size: 0.9rem; color: var(--text-secondary);">${
              reward.reward
            }</div>
          </div>
          <div style="font-size: 1.2rem;">
            ${isCompleted ? "✅" : isAvailable ? "🎁" : "🔒"}
          </div>
        </div>
      `;
      })
      .join("");
  }

  updateWeeklyChallenges() {
    const weeklyChallenges = document.getElementById("weekly-challenges");
    if (!weeklyChallenges) return;

    const challenges = this.getWeeklyChallenges();
    weeklyChallenges.innerHTML = challenges
      .map((challenge) => {
        const progress = Math.min(
          (challenge.progress / challenge.target) * 100,
          100
        );
        const isCompleted = challenge.progress >= challenge.target;

        return `
        <div class="challenge-item ${isCompleted ? "completed" : ""}">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="font-size: 1.2rem;">${challenge.icon}</span>
              <div style="font-weight: 500;">${challenge.name}</div>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">
              ${challenge.description}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <span style="font-size: 0.9rem;">${challenge.progress}/${
          challenge.target
        }</span>
              <span style="color: var(--accent-mint); font-weight: 600;">+${
                challenge.reward
              } ⭐</span>
            </div>
            <div class="challenge-progress">
              <div class="challenge-progress-bar" style="width: ${progress}%;"></div>
            </div>
          </div>
          <div style="margin-left: 15px;">
            ${isCompleted ? "✅" : "⏳"}
          </div>
        </div>
      `;
      })
      .join("");
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

    // Daily bonus buttons
    const claimDailyBtn = document.getElementById("claim-daily-btn");
    if (claimDailyBtn) {
      claimDailyBtn.addEventListener("click", () => this.claimDailyBonus());
    }

    const claimDailyMainBtn = document.getElementById("claim-daily-main-btn");
    if (claimDailyMainBtn) {
      claimDailyMainBtn.addEventListener("click", () => this.claimDailyBonus());
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
    this.bindDailyBonusEvents();
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
    // Handle both old shortcut-chip and new card-modern structures
    document
      .querySelectorAll(".shortcut-chip, .card-modern[data-service]")
      .forEach((chip) => {
        chip.addEventListener("click", (e) => {
          const serviceId = e.currentTarget.getAttribute("data-service");
          if (serviceId) {
            this.quickAwardService(serviceId);
          }
        });
      });
  }

  bindDailyBonusEvents() {
    // Home daily bonus button
    const claimDailyBtn = document.getElementById("claim-daily-btn");
    if (claimDailyBtn) {
      claimDailyBtn.addEventListener("click", () => this.claimDailyBonus());
    }

    // Daily screen daily bonus button
    const claimDailyMainBtn = document.getElementById("claim-daily-main-btn");
    if (claimDailyMainBtn) {
      claimDailyMainBtn.addEventListener("click", () => this.claimDailyBonus());
    }
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

    // Update weekly progress
    this.data.weeklyProgress.visits += 1;
    this.data.weeklyProgress.starsEarned += actualAwarded;
    services.forEach((serviceId) => {
      this.data.weeklyProgress.servicesUsed.add(serviceId);
    });

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
  if (
    e.target.matches(
      "button, .shortcut-chip, .service-item, .switch, .card-modern, .action-btn-modern"
    )
  ) {
    hapticFeedback("light");
  }
});
