/* INDEX.HTML */
    /* CARDS */
    function toggleFeature(clickedElement) {
    const allFeatures = document.querySelectorAll(".feature-box");

    allFeatures.forEach((item) => {
        // fecha todos os outros
        if (item !== clickedElement) {
        item.classList.remove("active");
        }
    });

    // alterna o clicado
    clickedElement.classList.toggle("active");
    }

    /* BACK TO TOP */
    // Mostrar botão ao rolar
    window.onscroll = function () {
    const btn = document.getElementById("backToTop");

    if (document.documentElement.scrollTop > 300) {
        btn.style.display = "block";
    } else {
        btn.style.display = "none";
    }
    };

    // Voltar ao topo suavemente
    document.getElementById("backToTop").onclick = function () {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
    };