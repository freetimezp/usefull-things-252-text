(function () {
    const canvas = document.getElementById("pixi-canvas");

    const bg = document.querySelector(".bg");
    const bgStyle = getComputedStyle(bg).backgroundImage; // url("...")
    const urlMatch = /url\((?:"|')?(.*?)(?:"|')?\)/.exec(bgStyle);
    const imageUrl = urlMatch ? urlMatch[1] : "";

    const app = new PIXI.Application({ view: canvas, backgroundAlpha: 0, resizeTo: window, antialias: true });

    const sprite = PIXI.Sprite.from(imageUrl);

    console.log(app);

    sprite.width = app.renderer.width;
    sprite.height = app.renderer.height;
    sprite.x = 0;
    sprite.y = 0;
    sprite.scaleMode = PIXI.SCALE_MODES.LINEAR;

    const svg =
        `data:image/svg+xml;utf8,` +
        encodeURIComponent(
            `
            <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
                <filter id='t'>
                    <feTurbulence baseFrequency='0.9' numOctaves='3' stitchTiles='stitch' seed='2'/>
                </filter>
                <rect width='100%' height='100%' filter='url(#t)' fill='white'/>
            </svg>
            `
        );

    const displacementSprite = PIXI.Sprite.from(svg);

    displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    displacementSprite.width = app.renderer.width * 1.5;
    displacementSprite.height = app.renderer.height * 1.5;
    displacementSprite.x = 0;
    displacementSprite.y = 0;

    const displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);

    displacementFilter.padding = 20;

    const container = new PIXI.Container();
    container.addChild(sprite);
    container.filters = [displacementFilter];

    displacementSprite.visible = false; // we don't want to see the raw noise
    app.stage.addChild(container);
    app.stage.addChild(displacementSprite);

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        sprite.width = w;
        sprite.height = h;
        displacementSprite.width = w * 1.5;
        displacementSprite.height = h * 1.5;

        displacementSprite.x = -(displacementSprite.width - w) / 2;
        displacementSprite.y = -(displacementSprite.height - h) / 2;
    }
    window.addEventListener("resize", resize);
    resize();

    displacementFilter.scale.x = 300;
    displacementFilter.scale.y = 300;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.to(displacementFilter.scale, { x: 0, y: 0, duration: 1.8 }, 0);

    tl.to(displacementFilter.scale, { x: 12, y: 8, duration: 0.9, repeat: 1, yoyo: true, ease: "sine.inOut" }, ">-0.2");

    const title = document.querySelector(".reveal-title");
    const text = title.textContent.trim();
    title.innerHTML = "";
    const chars = text.split("");
    chars.forEach((ch) => {
        const s = document.createElement("span");
        s.className = "char";
        s.style.display = "inline-block";
        s.style.transformOrigin = "50% 50%";
        s.textContent = ch;
        title.appendChild(s);
    });

    // animate the chars (stagger fade/slide)
    tl.from(".char", { duration: 1, y: 30, opacity: 0, stagger: 0.02, ease: "power3.out" }, 0.3);

    function updateCanvasMask() {
        const svgEl = document.getElementById("textMask");

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgEl);
        const encoded = "data:image/svg+xml;utf8," + encodeURIComponent(svgString);
        const canvasEl = document.getElementById("pixi-canvas");

        canvasEl.style.webkitMaskImage = `url("${encoded}")`;
        canvasEl.style.maskImage = `url("${encoded}")`;
        canvasEl.style.webkitMaskRepeat = "no-repeat";
        canvasEl.style.maskRepeat = "no-repeat";
        canvasEl.style.webkitMaskPosition = "center center";
        canvasEl.style.maskPosition = "center center";
        canvasEl.style.webkitMaskSize = "contain";
        canvasEl.style.maskSize = "contain";
    }

    updateCanvasMask();
    window.addEventListener("resize", updateCanvasMask);

    window.addEventListener("mousemove", (e) => {
        const nx = (e.clientX / innerWidth - 0.5) * 2;
        const ny = (e.clientY / innerHeight - 0.5) * 2;

        const MOVE_STRENGTH = 200;

        gsap.to(displacementSprite, {
            x: -nx * MOVE_STRENGTH - (displacementSprite.width - innerWidth) / 2,
            y: -ny * MOVE_STRENGTH - (displacementSprite.height - innerHeight) / 2,
            duration: 0.6,
            ease: "power2.out",
        });

        const dist = Math.hypot(nx, ny);
        const strength = 12 + (1 - Math.min(1, dist)) * 30; // was 6..18 → now ~12..42
        gsap.to(displacementFilter.scale, {
            x: strength,
            y: strength * 0.9,
            duration: 0.5,
            ease: "power2.out",
        });
    });

    window.addEventListener("pointerdown", () => {
        tl.restart();
    });

    gsap.to(displacementSprite, { x: `-=${50}`, y: `-=${30}`, duration: 12, repeat: -1, ease: "none" });

    app.ticker.add(() => {
        displacementSprite.x += Math.sin(performance.now() * 0.006) * 0.4;
        displacementSprite.y += Math.cos(performance.now() * 0.005) * 0.4;
    });
})();
