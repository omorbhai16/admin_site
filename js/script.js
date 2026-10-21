/* ==========================================================================
   YT Channel BD — script.js
   গঠন (একটার পর একটা ক্লাস):
     1. CONFIG         — WhatsApp নাম্বার, ফাইল পাথ ইত্যাদি সেটিংস
     2. Utils          — ছোট সাহায্যকারী ফাংশন
     3. Navigation     — মেনু ও পেজ পরিবর্তন
     4. Lightbox       — ছবি বড় করে দেখানো
     5. ChannelList    — চ্যানেল কার্ড তৈরি + ফিল্টার (সব / Available / Sold)
     6. ReviewList     — রিভিউ কার্ড তৈরি
     7. FallingLogos   — পড়ন্ত YouTube লোগো
     8. App            — সব ক্লাস চালু করে
   ========================================================================== */


/* ==========================================================================
   1. CONFIG
   ========================================================================== */
const CONFIG = {
  whatsapp: "8801400629201",
  channelsJson: "data/channels.json",
  reviewsJson: "data/reviews.json",
  channelPhotoDir: "channel_photo",
  reviewPhotoDir: "review_photo",
  defaultAdmin: "Jahid Hassan",
  logoDelay: 2000,      // প্রথম লোগো পড়ার আগে অপেক্ষা (ms)
  logoGap: 1000,        // এক লোগো শেষ হওয়ার পর পরেরটার আগে বিরতি (ms)
};


/* ==========================================================================
   2. Utils — সাহায্যকারী ফাংশন
   ========================================================================== */
class Utils {
  /** ছবি না পাওয়া গেলে এটা দেখাবে */
  static PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
        '<rect width="100%" height="100%" fill="#f3f3f3"/>' +
        '<text x="50%" y="50%" text-anchor="middle" fill="#999" ' +
        'font-family="sans-serif" font-size="20">ছবি নেই</text></svg>'
    );

  /** document.querySelector-এর ছোট রূপ */
  static $(selector) {
    return document.querySelector(selector);
  }

  /** HTML-এর বিশেষ চিহ্ন নিরাপদ করে (XSS থেকে সুরক্ষা) */
  static escape(text) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
    return String(text ?? "").replace(/[&<>"]/g, (ch) => map[ch]);
  }

  /** <img> ট্যাগ বানায়; ছবি লোড না হলে placeholder বসে */
  static image(src, alt) {
    return `<img src="${Utils.escape(src)}" alt="${Utils.escape(alt)}" loading="lazy"
      onerror="this.onerror=null;this.src='${Utils.PLACEHOLDER}'">`;
  }

  /** JSON ফাইল লোড করে */
  static async loadJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url} লোড হয়নি`);
    return response.json();
  }
}


/* ==========================================================================
   3. Navigation — মেনু ও পেজ পরিবর্তন
   ========================================================================== */
class Navigation {
  constructor() {
    this.menu = Utils.$("#menu");
    this.burger = Utils.$("#burger");
    this.pages = document.querySelectorAll(".page");
  }

  init() {
    this.burger.addEventListener("click", () => this.toggleMenu());
    window.addEventListener("hashchange", () => this.showPage());
    this.showPage();
  }

  /** মোবাইল মেনু খোলা/বন্ধ */
  toggleMenu() {
    const isOpen = this.menu.classList.toggle("open");
    this.burger.classList.toggle("open", isOpen);
    this.burger.setAttribute("aria-expanded", isOpen);
  }

  closeMenu() {
    this.menu.classList.remove("open");
    this.burger.classList.remove("open");
    this.burger.setAttribute("aria-expanded", false);
  }

  /** URL-এর #hash অনুযায়ী সঠিক পেজ দেখায় */
  showPage() {
    const hash = (location.hash || "#home").slice(1);
    const target = document.getElementById(hash) ? hash : "home";

    this.pages.forEach((page) => {
      page.classList.toggle("show", page.id === target);
    });

    this.menu.querySelectorAll("a").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === "#" + target);
    });

    this.closeMenu();
    window.scrollTo(0, 0);
  }
}


/* ==========================================================================
   4. Lightbox — ছবি বড় করে দেখানো
   ========================================================================== */
class Lightbox {
  constructor() {
    this.box = Utils.$("#lightbox");
    this.image = this.box.querySelector("img");
  }

  init() {
    document.addEventListener("click", (e) => this.handleClick(e));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });
  }

  handleClick(e) {
    if (e.target.matches(".gallery img, .rv img")) {
      this.open(e.target.src);
    } else if (this.box.contains(e.target)) {
      this.close();
    }
  }

  open(src) {
    this.image.src = src;
    this.box.hidden = false;
  }

  close() {
    this.box.hidden = true;
  }
}


/* ==========================================================================
   5. ChannelList — চ্যানেল কার্ড তৈরি + ফিল্টার
   ছবি আসে channel_photo/<id>/<ফাইল> থেকে,
   তাই এক চ্যানেলের ছবি অন্য চ্যানেলে মিশবে না।

   ফিল্টার: "সব চ্যানেল" / "Available" / "Sold"
   বাটনগুলো এই ক্লাস নিজেই Channel Phone পেজে বসিয়ে দেয়,
   তাই index.html বা style.css বদলাতে হয় না।
   ========================================================================== */
class ChannelList {
  constructor() {
    this.container = Utils.$("#channelList");
    this.channels = [];
    this.filter = "all"; // all | available | sold
    this.filterBar = null;
  }

  async init() {
    try {
      const data = await Utils.loadJson(CONFIG.channelsJson);
      this.channels = data.channels || [];
      this.injectStyles();
      this.buildFilterBar();
      this.render();
    } catch {
      this.container.innerHTML =
        "<p>তথ্য লোড হয়নি। Live Server বা হোস্টিং-এ চালান।</p>";
    }
  }

  /* ---------- ফিল্টার ---------- */

  /** ফিল্টার বাটনের স্টাইল (JS থেকেই যোগ হয়) */
  injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 26px;
      }
      .filter-btn {
        padding: 10px 20px;
        background: #fff;
        color: var(--ink);
        font: inherit;
        font-weight: 700;
        border: 2px solid var(--ink);
        border-radius: 50px;
        cursor: pointer;
        transition: 0.25s;
      }
      .filter-btn:hover {
        border-color: var(--red);
        color: var(--red);
        transform: translateY(-2px);
      }
      .filter-btn.active {
        background: var(--red);
        border-color: var(--red);
        color: #fff;
      }
      .filter-btn[data-filter="available"].active {
        background: var(--green);
        border-color: var(--green);
      }
      .filter-btn:focus-visible {
        outline: 3px solid var(--ink);
        outline-offset: 2px;
      }
      .filter-btn .count {
        margin-left: 6px;
        padding: 1px 8px;
        font-size: 0.85rem;
        background: rgba(0, 0, 0, 0.08);
        border-radius: 20px;
      }
      .filter-btn.active .count {
        background: rgba(255, 255, 255, 0.25);
      }
      .filter-empty {
        padding: 30px 0;
        color: var(--muted);
      }
    `;
    document.head.appendChild(style);
  }

  /** ফিল্টার বাটনের বার তৈরি করে চ্যানেল লিস্টের ঠিক উপরে বসায় */
  buildFilterBar() {
    this.filterBar = document.createElement("div");
    this.filterBar.className = "filter-bar";
    this.filterBar.setAttribute("role", "group");
    this.filterBar.setAttribute("aria-label", "চ্যানেল ফিল্টার");

    this.filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      this.filter = btn.dataset.filter;
      this.render();
    });

    this.container.before(this.filterBar);
  }

  /**
   * বাটনের সংখ্যা আসে index.html-এর হোম পেজের কাউন্টার বক্স থেকে
   * (১ম = চ্যানেল এখনো আছে, ২য় = বিক্রি হয়েছে, ৩য় = মোট)।
   * ওখানে সংখ্যা বদলালেই বাটনের সংখ্যাও বদলে যাবে।
   * সংখ্যা না পাওয়া গেলে channels.json থেকে গুনে নেবে।
   */
  readCounts() {
    const toNumber = (text) => {
      // বাংলা অঙ্ক (০-৯) থাকলে ইংরেজিতে বদলে নেয়
      const en = String(text).replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d));
      const n = parseInt(en.replace(/[^\d]/g, ""), 10);
      return Number.isNaN(n) ? null : n;
    };

    const boxes = [...document.querySelectorAll(".stats b")].map((b) => toNumber(b.textContent));

    const soldFromJson = this.channels.filter((c) => this.isSold(c)).length;
    return {
      available: boxes[0] ?? this.channels.length - soldFromJson,
      sold: boxes[1] ?? soldFromJson,
      all: boxes[2] ?? this.channels.length,
    };
  }

  /** ফিল্টার বাটন আঁকে (সংখ্যাসহ) ও সক্রিয়টা চিহ্নিত করে */
  renderFilterBar() {
    const counts = this.readCounts();
    const options = [
      ["all", "সব চ্যানেল"],
      ["available", "Available"],
      ["sold", "Sold"],
    ];

    this.filterBar.innerHTML = options
      .map(
        ([key, label]) => `
        <button type="button" class="filter-btn ${this.filter === key ? "active" : ""}"
          data-filter="${key}" aria-pressed="${this.filter === key}">
          ${label}<span class="count">${counts[key]}</span>
        </button>`
      )
      .join("");
  }

  /** বর্তমান ফিল্টার অনুযায়ী চ্যানেল বেছে নেয় */
  filtered() {
    if (this.filter === "available") return this.channels.filter((c) => !this.isSold(c));
    if (this.filter === "sold") return this.channels.filter((c) => this.isSold(c));
    return this.channels;
  }

  /* ---------- কার্ড ---------- */

  render() {
    this.renderFilterBar();

    const list = this.filtered();
    if (list.length) {
      this.container.innerHTML = list.map((channel) => this.buildCard(channel)).join("");
      return;
    }

    const messages = {
      all: "এখনো কোনো চ্যানেল যোগ করা হয়নি।",
      available: "এই মুহূর্তে কোনো চ্যানেল Available নেই।",
      sold: "এখনো কোনো চ্যানেল বিক্রি হয়নি।",
    };
    this.container.innerHTML = `<p class="filter-empty">${messages[this.filter]}</p>`;
  }

  /** চ্যানেল বিক্রি হয়েছে কি না */
  isSold(channel) {
    return String(channel.status).toLowerCase() === "sold";
  }

  buildPhotos(channel) {
    return (channel.photos || [])
      .map((photo, i) =>
        Utils.image(
          `${CONFIG.channelPhotoDir}/${channel.id}/${photo}`,
          `Channel ${channel.number} ছবি ${i + 1}`
        )
      )
      .join("");
  }

  buildInfo(channel) {
    const e = Utils.escape;
    return `
      <ul class="info">
        <li><b>১) দাম</b><span class="price">${e(channel.price)}</span></li>
        <li><b>২) সর্বমোট ভিউস</b>${e(channel.total_views)}</li>
        <li><b>৩) লাস্ট ৪৮ ঘন্টার ভিউস</b>${e(channel.views_48h)}</li>
        <li><b>৪) লাস্ট ৩০ দিনের ভিউস</b>${e(channel.views_30d)}</li>
        <li><b>৫) সাবস্ক্রাইবার</b>${e(channel.subscribers)}</li>
        <li><b>৬) মনিটাইজেশন</b>${e(channel.monetization)}</li>
        <li><b>৭) শর্ট ও লং ভিডিও</b>Shorts: ${e(channel.shorts)} | Long: ${e(channel.long)}</li>
        <li><b>৮) ক্যাটাগরি</b>${e(channel.category)}</li>
      </ul>`;
  }

  buildBuyButton(channel) {
    const message = encodeURIComponent(`আমি চ্যানেল নাম্বার ${channel.number} কিনতে চাই।`);
    return `<a class="btn" target="_blank" rel="noopener"
      href="https://wa.me/${CONFIG.whatsapp}?text=${message}">WhatsApp-এ কিনুন</a>`;
  }

  buildCard(channel) {
    const sold = this.isSold(channel);
    return `
      <article class="channel">
        <div class="ch-head">
          <h3>Channel No: ${Utils.escape(channel.number)}</h3>
          <span class="tag ${sold ? "no" : "yes"}">${sold ? "Not Available" : "Available"}</span>
        </div>
        <div class="gallery">${this.buildPhotos(channel)}</div>
        ${this.buildInfo(channel)}
        <p class="desc">${Utils.escape(channel.details)}</p>
        ${sold ? "" : this.buildBuyButton(channel)}
      </article>`;
  }
}


/* ==========================================================================
   6. ReviewList — রিভিউ কার্ড তৈরি
   ========================================================================== */
class ReviewList {
  constructor() {
    this.container = Utils.$("#reviewGrid");
  }

  async init() {
    try {
      const data = await Utils.loadJson(CONFIG.reviewsJson);
      this.render(data.reviews || []);
    } catch {
      // রিভিউ লোড না হলে চুপচাপ থাকবে
    }
  }

  render(reviews) {
    this.container.innerHTML =
      reviews.map((review, i) => this.buildCard(review, i)).join("") ||
      "<p>শীঘ্রই রিভিউ যোগ হবে।</p>";
  }

  buildCard(review, index) {
    const e = Utils.escape;
    return `
      <figure class="rv">
        <span class="badge">${index + 1}</span>
        ${Utils.image(`${CONFIG.reviewPhotoDir}/${review.photo}`, `Review ${index + 1}`)}
        <figcaption>
          <p><b>Day:</b> ${e(review.day)}</p>
          <p><b>Time:</b> ${e(review.time)}</p>
          <p><b>Date:</b> ${e(review.date)}</p>
          <p><b>Deal Number:</b> ${e(review.deal)}</p>
          <p><b>Channel type:</b> ${e(review.type)}</p>
          <p><b>Sell for:</b> ${e(review.price)}</p>
          <p><b>Admin:</b> ${e(review.admin || CONFIG.defaultAdmin)}</p>
        </figcaption>
      </figure>`;
  }
}


/* ==========================================================================
   7. FallingLogos — পড়ন্ত YouTube লোগো
   একটা পড়ে শেষ হলে ১ সেকেন্ড পর পরেরটা পড়ে।
   ========================================================================== */
class FallingLogos {
  static SVG =
    '<svg viewBox="0 0 90 64" width="100%" height="100%">' +
    '<rect width="90" height="64" rx="16" fill="#e10600"/>' +
    '<path d="M36 18l22 14-22 14z" fill="#fff"/></svg>';

  /** যাদের অ্যানিমেশন বন্ধ করা আছে তাদের জন্য চালু হবে না */
  static isAllowed() {
    return !matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  init() {
    if (!FallingLogos.isAllowed()) return;
    setTimeout(() => this.drop(), CONFIG.logoDelay);
  }

  drop() {
    const logo = this.createLogo();
    logo.addEventListener("animationend", () => {
      logo.remove();
      setTimeout(() => this.drop(), CONFIG.logoGap);
    });
    document.body.appendChild(logo);
  }

  createLogo() {
    const size = 40 + Math.random() * 40;
    const left = Math.random() * (innerWidth - size);
    const direction = Math.random() < 0.5 ? "-" : "";
    const spin = `${direction}${360 + Math.random() * 360}deg`;

    const logo = document.createElement("div");
    logo.className = "yt-fall";
    logo.innerHTML = FallingLogos.SVG;
    logo.style.cssText =
      `width:${size}px;height:${size * 0.71}px;left:${left}px;--spin:${spin}`;
    return logo;
  }
}


/* ==========================================================================
   8. App — সব কিছু চালু করে
   ========================================================================== */
class App {
  start() {
    new Navigation().init();
    new Lightbox().init();
    new ChannelList().init();
    new ReviewList().init();
    new FallingLogos().init();
  }
}

new App().start();
