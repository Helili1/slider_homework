// ОСНОВНАЯ СТРУКТУРА КЛАССА
class Slider {
  // Конструктор - инициализация основных параметров
  constructor(container, options = {}) {
    // Ссылки на DOM-элементы
    this.container = container; // Основной контейнер слайдера
    this.wrapper = container.querySelector(".slider-wrapper"); // Обертка для слайдов
    this.slides = Array.from(this.wrapper.children); // Массив исходных слайдов
    this.navigation = container.querySelector(".navigation"); // Контейнер для точек навигации

    // Настройки с значениями по умолчанию
    this.options = {
      slidesToShow: 1, // Количество видимых слайдов
      infinite: true, // Бесконечная прокрутка
      autoplay: true, // Автоматическое переключение
      speed: 3000, // Скорость автоплея
      ...options, // Переопределение пользовательских настроек
    };

    // Состояние слайдера
    this.currentIndex = 0; // Текущий индекс слайда
    this.touchStartX = 0; // Начальная позиция касания/мыши
    this.translateOffset = 0; // Текущее смещение слайдов
    this.isDragging = false; // Флаг перетаскивания
    this.gap = 50; // Расстояние между слайдами

    // Инициализация слайдера
    this.init();
    // Обработчик изменения размера окна
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  // Обработка изменения размера окна
  handleResize() {
    // Адаптивное количество слайдов для разных экранов
    const newSlidesToShow = window.innerWidth >= 1200 ? 2 : 1;
    this.options.slidesToShow = newSlidesToShow;

    // Переинициализация параметров
    this.setupSlider();
    this.createNavigation();
    // Корректировка индекса для бесконечного режима
    this.currentIndex = this.options.infinite ? this.options.slidesToShow : 0;
    this.setTranslate();
  }

  //  ИНИЦИАЛИЗАЦИЯ СЛАЙДЕРА
  init() {
    this.setupSlider(); // Настройка размеров и позиций
    this.createNavigation(); // Создание точек навигации
    this.addEventListeners(); // Добавление обработчиков событий

    // Запуск автоплея если включен
    if (this.options.autoplay) this.startAutoplay();
  }

  // Настройка базовых параметров слайдера
  setupSlider() {
    // Установка CSS-переменных
    this.wrapper.style.setProperty(
      "--slides-to-show",
      this.options.slidesToShow
    );
    this.wrapper.style.setProperty("--gap", `${this.gap}px`);

    // Расчет ширины слайдов с учетом промежутков
    const totalGap = this.gap * (this.options.slidesToShow - 1);
    this.slideWidth =
      (this.container.offsetWidth - totalGap) / this.options.slidesToShow;

    // Бесконечный режим: клонирование слайдов
    if (this.options.infinite) {
      this.cloneSlides();
      this.currentIndex = this.options.slidesToShow;
      this.setTranslate();
    }

    // Установка фиксированной ширины для всех слайдов
    this.slides.forEach((slide) => {
      slide.style.width = `${this.slideWidth}px`;
    });
  }

  // Клонирование слайдов для бесконечной прокрутки
  cloneSlides() {
    // Клонируем первые и последние слайды
    const firstClones = this.slides
      .slice(0, this.options.slidesToShow)
      .map((slide) => slide.cloneNode(true));
    const lastClones = this.slides
      .slice(-this.options.slidesToShow)
      .map((slide) => slide.cloneNode(true));

    // Добавляем клоны в начало и конец
    this.wrapper.prepend(...lastClones);
    this.wrapper.append(...firstClones);
    // Обновляем массив слайдов
    this.slides = Array.from(this.wrapper.children);
  }

  // НАВИГАЦИЯ И ТОЧКИ
  // Создание точек-индикаторов
  createNavigation() {
    this.navigation.innerHTML = ""; // Очистка предыдущих точек

    // Расчет количества точек с учетом бесконечного режима
    const slidesCount = this.options.infinite
      ? this.slides.length - 2 * this.options.slidesToShow
      : this.slides.length;

    // Генерация точек
    for (let i = 0; i < slidesCount; i++) {
      const dot = document.createElement("div");
      dot.classList.add("navigation-dot");
      // Обработчик клика с замыканием индекса
      dot.addEventListener("click", () => this.goToSlide(i));
      this.navigation.appendChild(dot);
    }
    this.updateNavigation();
  }

  // Обновление активной точки
  updateNavigation() {
    // Расчет индекса с учетом бесконечного режима
    const activeIndex = this.options.infinite
      ? (this.currentIndex - this.options.slidesToShow) %
        (this.slides.length - 2 * this.options.slidesToShow)
      : this.currentIndex;

    // Обновление класса active для точек
    Array.from(this.navigation.children).forEach((dot, index) => {
      dot.classList.toggle("active", index === activeIndex);
    });
  }

  // ОБРАБОТКА СОБЫТИЙ
  // Добавление всех обработчиков
  addEventListeners() {
    // Touch-события для мобильных устройств
    this.container.addEventListener("touchstart", this.handleTouchStart);
    this.container.addEventListener("touchmove", this.handleTouchMove);
    this.container.addEventListener("touchend", this.handleTouchEnd);

    // Mouse-события для десктопов
    this.container.addEventListener("mousedown", this.handleMouseDown);
    this.container.addEventListener("mousemove", this.handleMouseMove);
    this.container.addEventListener("mouseup", this.handleMouseUp);
    this.container.addEventListener("mouseleave", this.handleMouseUp);

    // Дополнительный обработчик ресайза
    window.addEventListener("resize", () => {
      this.slideWidth = this.container.offsetWidth / this.options.slidesToShow;
      this.setTranslate();
    });
  }

  // Обработчики touch-событий
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

  // Обработчики mouse-событий
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

  // ЛОГИКА ПЕРЕТАСКИВАНИЯ
  // Начало перетаскивания
  startDrag() {
    this.isDragging = true;
    this.wrapper.style.transition = "none"; // Отключаем анимацию
    this.dragDistance = 0;
    if (this.intervalId) clearInterval(this.intervalId); // Останавливаем автоплей
  }

  // Процесс перетаскивания
  handleDrag(currentX) {
    if (!this.isDragging) return;

    // Расчет смещения
    const diffX = currentX - this.touchStartX;
    this.dragDistance = diffX;
    this.translateOffset = -this.currentIndex * this.slideWidth + diffX;

    // Плавное обновление позиции
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(() => {
      this.wrapper.style.transform = `translateX(${this.translateOffset}px)`;
    });
  }

  // Завершение перетаскивания
  endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    cancelAnimationFrame(this.animationFrame);

    // Проверка порога срабатывания
    const threshold = this.container.offsetWidth * 0.1;
    if (Math.abs(this.dragDistance) > threshold) {
      // Определение направления
      this.dragDistance > 0 ? this.prevSlide() : this.nextSlide();
    } else {
      // Возврат к исходной позиции
      this.wrapper.style.transition = "transform 0.5s ease-in-out";
      this.setTranslate();
    }

    // Перезапуск автоплея
    if (this.options.autoplay) this.startAutoplay();
  }

  // ОСНОВНЫЕ МЕТОДЫ УПРАВЛЕНИЯ
  // Установка позиции слайдов
  setTranslate() {
    this.translateOffset = -this.currentIndex * this.slideWidth;
    this.wrapper.style.transform = `translateX(${this.translateOffset}px)`;
  }

  // Следующий слайд
  nextSlide() {
    this.currentIndex++;
    this.wrapper.style.transition = "transform 0.5s ease-in-out";

    // Логика бесконечной прокрутки
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

  // Предыдущий слайд
  prevSlide() {
    this.currentIndex--;
    this.wrapper.style.transition = "transform 0.5s ease-in-out";

    // Логика бесконечной прокрутки
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

  // Переход к конкретному слайду
  goToSlide(index) {
    // Корректировка индекса для бесконечного режима
    if (this.options.infinite) {
      this.currentIndex = index + this.options.slidesToShow;
    } else {
      this.currentIndex = index;
    }
    this.setTranslate();
    this.updateNavigation();
  }

  // АВТОПЛЕЙ
  startAutoplay() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.nextSlide(), this.options.speed);
  }
}

// ИНИЦИАЛИЗАЦИЯ ЭКЗЕМПЛЯРА (СЛАЙДА)
const slider = new Slider(document.getElementById("slider"), {
  slidesToShow: 1, // Показывать 1 слайд
  infinite: true, // Включить бесконечный режим
  autoplay: true, // Автоматическое переключение
  speed: 2500, // Интервал 2.5 секунды
});
