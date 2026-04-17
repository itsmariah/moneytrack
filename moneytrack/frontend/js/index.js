function toggleFeature(clickedElement) {
  const allFeatures = document.querySelectorAll(".feature-box");

  allFeatures.forEach((item) => {
    if (item !== clickedElement) {
      item.classList.remove("active");
    }
  });

  clickedElement.classList.toggle("active");
}

window.onscroll = function () {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  if (document.documentElement.scrollTop > 300) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backToTop");

  if (backBtn) {
    backBtn.onclick = function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };
  }

  createMoneyAnimation();
});

function createMoneyAnimation() {
  const container = document.querySelector(".money-bg");
  if (!container) return;

  for (let i = 0; i < 30; i++) {
    const span = document.createElement("span");
    span.innerText = "$";
    span.style.left = Math.random() * 100 + "vw";
    span.style.fontSize = Math.random() * 30 + 15 + "px";
    span.style.animationDuration = Math.random() * 5 + 5 + "s";
    span.style.animationDelay = Math.random() * 5 + "s";
    container.appendChild(span);
  }
}