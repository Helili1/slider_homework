class Slider {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      slidesToShow: 1,
      infinite: true,
      autoplay: true,
      speed: 3000,
      ...options,
    };
    this.wrapper = container.querySelector(".slider-wrapper");
    this.slides = Array.from(this.wrapper.children);
    this.navigation = container.querySelector(".navigation");
    this.currentIndex = 0;
    this.touchStartX = 0;
    this.translateOffset = 0;
    this.intervalId = null;
    this.isDragging = false;
    this.animationFrame = null;
    this.slideWidth = 0;
    this.dragDistance = 0;
    this.gap = 50;

    this.init();
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  handleResize() {
    const newSlidesToShow = window.innerWidth >= 1200 ? 2 : 1;
    this.options.slidesToShow = newSlidesToShow;
    this.setupSlider();
    this.createNavigation();
    this.currentIndex = this.options.infinite ? this.options.slidesToShow : 0;
    this.setTranslate();
  }

  init() {
    this.setupSlider();
    this.createNavigation();
    this.addEventListeners();
    if (this.options.autoplay) this.startAutoplay();
  }

  setupSlider() {
    this.wrapper.style.setProperty(
      "--slides-to-show",
      this.options.slidesToShow
    );
    this.wrapper.style.setProperty("--gap", `${this.gap}px`);

    const totalGap = this.gap * (this.options.slidesToShow - 1);
    this.slideWidth =
      (this.container.offsetWidth - totalGap) / this.options.slidesToShow;

    if (this.options.infinite) {
      this.cloneSlides();
      this.currentIndex = this.options.slidesToShow;
      this.setTranslate();
    }

    this.slides.forEach((slide) => {
      slide.style.width = `${this.slideWidth}px`;
    });
  }

  cloneSlides() {
    const firstClones = this.slides
      .slice(0, this.options.slidesToShow)
      .map((slide) => slide.cloneNode(true));
    const lastClones = this.slides
      .slice(-this.options.slidesToShow)
      .map((slide) => slide.cloneNode(true));

    this.wrapper.prepend(...lastClones);
    this.wrapper.append(...firstClones);
    this.slides = Array.from(this.wrapper.children);
  }

  createNavigation() {
    this.navigation.innerHTML = "";
    const slidesCount = this.options.infinite
      ? this.slides.length - 2 * this.options.slidesToShow
      : this.slides.length;

    // Всегда создаем точки навигации
    for (let i = 0; i < slidesCount; i++) {
      const dot = document.createElement("div");
      dot.classList.add("navigation-dot");
      dot.addEventListener("click", () => this.goToSlide(i));
      this.navigation.appendChild(dot);
    }
    this.updateNavigation();
  }

  updateNavigation() {
    const activeIndex = this.options.infinite
      ? (this.currentIndex - this.options.slidesToShow) %
        (this.slides.length - 2 * this.options.slidesToShow)
      : this.currentIndex;

    Array.from(this.navigation.children).forEach((dot, index) => {
      dot.classList.toggle("active", index === activeIndex);
    });
  }

  addEventListeners() {
    // Touch events
    this.container.addEventListener("touchstart", this.handleTouchStart);
    this.container.addEventListener("touchmove", this.handleTouchMove);
    this.container.addEventListener("touchend", this.handleTouchEnd);

    // Mouse events
    this.container.addEventListener("mousedown", this.handleMouseDown);
    this.container.addEventListener("mousemove", this.handleMouseMove);
    this.container.addEventListener("mouseup", this.handleMouseUp);
    this.container.addEventListener("mouseleave", this.handleMouseUp);

    // Window resize
    window.addEventListener("resize", () => {
      this.slideWidth = this.container.offsetWidth / this.options.slidesToShow;
      this.setTranslate();
    });
  }

  handleTouchStart = (e) => {
    this.touchStartX = e.touches[0].clientX;
    this.startDrag();
  };

  handleTouchMove = (e) => {
    this.handleDrag(e.touches[0].clientX);
  };

  handleTouchEnd = () => {
    this.endDrag();
  };

  handleMouseDown = (e) => {
    this.touchStartX = e.clientX;
    this.startDrag();
  };

  handleMouseMove = (e) => {
    if (this.isDragging) this.handleDrag(e.clientX);
  };

  handleMouseUp = () => {
    this.endDrag();
  };

  startDrag() {
    this.isDragging = true;
    this.wrapper.style.transition = "none";
    this.dragDistance = 0;
    if (this.intervalId) clearInterval(this.intervalId);
  }

  handleDrag(currentX) {
    if (!this.isDragging) return;

    const diffX = currentX - this.touchStartX;
    this.dragDistance = diffX;
    this.translateOffset = -this.currentIndex * this.slideWidth + diffX;

    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(() => {
      this.wrapper.style.transform = `translateX(${this.translateOffset}px)`;
    });
  }

  endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    cancelAnimationFrame(this.animationFrame);

    const threshold = this.container.offsetWidth * 0.1;
    if (Math.abs(this.dragDistance) > threshold) {
      this.dragDistance > 0 ? this.prevSlide() : this.nextSlide();
    } else {
      this.wrapper.style.transition = "transform 0.5s ease-in-out";
      this.setTranslate();
    }

    if (this.options.autoplay) this.startAutoplay();
  }

  setTranslate() {
    this.translateOffset = -this.currentIndex * this.slideWidth;
    this.wrapper.style.transform = `translateX(${this.translateOffset}px)`;
  }

  nextSlide() {
    this.currentIndex++;
    this.wrapper.style.transition = "transform 0.5s ease-in-out";

    if (
      this.options.infinite &&
      this.currentIndex > this.slides.length - this.options.slidesToShow
    ) {
      setTimeout(() => {
        this.wrapper.style.transition = "none";
        this.currentIndex = this.options.slidesToShow;
        this.setTranslate();
      }, 500);
    }

    this.setTranslate();
    this.updateNavigation();
  }

  prevSlide() {
    this.currentIndex--;
    this.wrapper.style.transition = "transform 0.5s ease-in-out";

    if (this.options.infinite && this.currentIndex < 0) {
      setTimeout(() => {
        this.wrapper.style.transition = "none";
        this.currentIndex = this.slides.length - 2 * this.options.slidesToShow;
        this.setTranslate();
      }, 500);
    }

    this.setTranslate();
    this.updateNavigation();
  }

  goToSlide(index) {
    if (this.options.infinite) {
      this.currentIndex = index + this.options.slidesToShow;
    } else {
      this.currentIndex = index;
    }
    this.setTranslate();
    this.updateNavigation();
  }

  startAutoplay() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.nextSlide(), this.options.speed);
  }
}

// Инициализация слайдера
const slider = new Slider(document.getElementById("slider"), {
  slidesToShow: 1,
  infinite: true,
  autoplay: true,
  speed: 2500,
});
