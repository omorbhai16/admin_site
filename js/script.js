const WA = "8801400629201";
const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f3f3f3"/><text x="50%" y="50%" text-anchor="middle" fill="#999" font-family="sans-serif" font-size="20">ছবি নেই</text></svg>');
const $ = s => document.querySelector(s);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const img = (src, alt) => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">`;

// Navigation
const menu = $("#menu"), burger = $("#burger");
burger.onclick = () => {
  const open = menu.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
};
function route() {
  const id = (location.hash || "#home").slice(1);
  const target = document.getElementById(id) ? id : "home";
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("show", p.id === target));
  menu.querySelectorAll("a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + target));
  menu.classList.remove("open"); burger.classList.remove("open");
  window.scrollTo(0, 0);
}
addEventListener("hashchange", route); route();

// Lightbox
const lb = $("#lightbox");
document.addEventListener("click", e => {
  if (e.target.matches(".gallery img, .rv img")) { lb.querySelector("img").src = e.target.src; lb.hidden = false; }
  else if (lb.contains(e.target)) lb.hidden = true;
});
addEventListener("keydown", e => { if (e.key === "Escape") lb.hidden = true; });

// Channels: ছবি আসে channel_photo/<id>/<ফাইল> থেকে — তাই এক চ্যানেলের ছবি অন্য চ্যানেলে মিশবে না
fetch("data/channels.json").then(r => r.json()).then(data => {
  const list = data.channels || [];
  $("#sold").textContent = data.sold_count ?? list.filter(c => c.status === "sold").length;
  $("#available").textContent = list.filter(c => c.status !== "sold").length;
  $("#channelList").innerHTML = list.map(c => {
    const sold = c.status === "sold";
    const photos = (c.photos || []).map((p, i) => img(`channel_photo/${c.id}/${p}`, `Channel ${c.number} ছবি ${i + 1}`)).join("");
    const msg = encodeURIComponent(`আমি চ্যানেল নাম্বার ${c.number} কিনতে চাই।`);
    return `<article class="channel">
      <div class="ch-head"><h3>Channel No: ${esc(c.number)}</h3><span class="tag ${sold ? "no" : "yes"}">${sold ? "Not Available" : "Available"}</span></div>
      <div class="gallery">${photos}</div>
      <ul class="info">
        <li><b>১) দাম</b><span class="price">${esc(c.price)}</span></li>
        <li><b>২) সর্বমোট ভিউস</b>${esc(c.total_views)}</li>
        <li><b>৩) লাস্ট ৪৮ ঘন্টার ভিউস</b>${esc(c.views_48h)}</li>
        <li><b>৪) লাস্ট ৩০ দিনের ভিউস</b>${esc(c.views_30d)}</li>
        <li><b>৫) সাবস্ক্রাইবার</b>${esc(c.subscribers)}</li>
        <li><b>৬) মনিটাইজেশন</b>${esc(c.monetization)}</li>
        <li><b>৭) শর্ট ও লং ভিডিও</b>Shorts: ${esc(c.shorts)} | Long: ${esc(c.long)}</li>
        <li><b>৮) ক্যাটাগরি</b>${esc(c.category)}</li>
      </ul>
      <p class="desc">${esc(c.details)}</p>
      ${sold ? "" : `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${msg}">WhatsApp-এ কিনুন</a>`}
    </article>`;
  }).join("") || "<p>এখনো কোনো চ্যানেল যোগ করা হয়নি।</p>";
}).catch(() => $("#channelList").innerHTML = "<p>তথ্য লোড হয়নি। Live Server বা হোস্টিং-এ চালান।</p>");

// Reviews
fetch("data/reviews.json").then(r => r.json()).then(d => {
  $("#reviewGrid").innerHTML = (d.reviews || []).map((r, i) => `<figure class="rv">
    <span class="badge">${i + 1}</span>
    ${img(`review_photo/${r.photo}`, `Review ${i + 1}`)}
    <figcaption>
      <p><b>Day:</b> ${esc(r.day)}</p><p><b>Time:</b> ${esc(r.time)}</p><p><b>Date:</b> ${esc(r.date)}</p>
      <p><b>Deal Number:</b> ${esc(r.deal)}</p><p><b>Channel type:</b> ${esc(r.type)}</p>
      <p><b>Sell for:</b> ${esc(r.price)}</p><p><b>Admin:</b> ${esc(r.admin || "Jahid Hassan")}</p>
    </figcaption></figure>`).join("") || "<p>শীঘ্রই রিভিউ যোগ হবে।</p>";
}).catch(() => {});

// পড়ন্ত YouTube লোগো: একটা পড়ে শেষ হলে ১ সেকেন্ড পর পরেরটা
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const svg = '<svg viewBox="0 0 90 64" width="100%" height="100%"><rect width="90" height="64" rx="16" fill="#e10600"/><path d="M36 18l22 14-22 14z" fill="#fff"/></svg>';
  const drop = () => {
    const el = document.createElement("div");
    el.className = "yt-fall";
    el.innerHTML = svg;
    const size = 40 + Math.random() * 40;
    el.style.cssText = `width:${size}px;height:${size * 0.71}px;left:${Math.random() * (innerWidth - size)}px;--spin:${Math.random() < .5 ? "-" : ""}${360 + Math.random() * 360}deg`;
    el.addEventListener("animationend", () => { el.remove(); setTimeout(drop, 1000); });
    document.body.appendChild(el);
  };
  setTimeout(drop, 2000);
}
