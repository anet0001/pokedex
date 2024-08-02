// TODO: Convert animations to use GSAP while considering media queries

class App {
  constructor() {
    // element selector handler
    this.elements = {
      preloader: {
        element: document.querySelector("#preloader"),
        children: {
          preview: document.querySelector(".pokedex-preview"),
          prompt: document.querySelector(".preloader__prompt-inner"),
          button: document.querySelector(".preloader__button"),
        },
      },
      onBoarding: {
        element: document.querySelector("#onBoarding"),
        children: {
          instructions: [
            ...document.querySelectorAll("#onBoarding .instruction"),
          ],
          progress: [
            ...document.querySelectorAll(
              "#onBoarding .instruction .progress path"
            ),
          ],
        },
      },
      pokedex: {
        element: document.querySelector("#pokedex"),
        children: {},
      },
      focusAreas: {
        children: {
          "active-screen": {
            element: document.querySelector("#pokedex .pokedex__active-screen"),
            trigger: document.querySelector(
              ".focus-controls__button[data-target='active-screen']"
            ),
          },
          "pokedex-info": {
            element: document.querySelector("#pokedex .pokedex__info"),
            trigger: document.querySelector(
              ".focus-controls__button[data-target='pokedex-info']"
            ),
          },
          "pokedex-list": {
            element: document.querySelector("#pokedex .pokedex__right"),
            trigger: document.querySelector(
              ".focus-controls__button[data-target='pokedex-list']"
            ),
          },
        },
      },
      focusControls: {
        element: document.querySelector(".focus-controls"),
        children: {
          button: [...document.querySelectorAll(".focus-controls__button")],
        },
      },
    };

    // local storage data handler
    this.data = {
      isOnBoarded: false,
    };

    this.currentFocus = null;

    this.onPreloaderClick = this.onPreloaderClick.bind(this);

    this.populateData();

    this.addEventListeners();
  }

  populateData() {
    Object.keys(this.data).forEach((key) => {
      if (localStorage.getItem(key) === null) {
        if (typeof this.data[key] === "string") {
          localStorage.setItem(key, this.data[key]);
        } else {
          localStorage.setItem(key, JSON.stringify(this.data[key]));
        }
      } else {
        this.data[key] = JSON.parse(localStorage.getItem(key));
      }
    });
  }

  triggerOnboarding() {
    this.onBoardingTimeline = gsap.timeline();
    this.progressTimeline = gsap.timeline();

    this.onBoardingTimeline.from(
      this.elements.onBoarding.children.instructions,
      {
        autoAlpha: 0,
        stagger: 0.125,
        ease: "power1.in",
      }
    );

    this.onBoardingTimeline.call(() => {
      this.elements.onBoarding.children.progress.forEach((progress, index) => {
        progress.style.animationDelay = `${index * 0.35}s`;

        progress.classList.add("active");

        if (this.elements.onBoarding.children.progress.length - 1 === index) {
          progress.addEventListener("animationend", () => {
            this.progressTimeline.to(
              this.elements.onBoarding.children.instructions,
              {
                autoAlpha: 0,
                stagger: 0.1,
                yPercent: -3,
                ease: "sine.inOut",
              }
            );

            this.progressTimeline.call(() => {
              this.elements.onBoarding.element.remove();
              // NOTE: persist onboarding state
              // this.data.isOnBoarded = true;
              // localStorage.setItem(
              //   "isOnBoarded",
              //   JSON.stringify(this.data.isOnBoarded)
              // );
            });
          });
        }
      });
    });
  }

  onPreloaderClick(target) {
    target.disabled = true;
    this.preloaderTimeline = gsap.timeline();

    this.preloaderTimeline
      .to(this.elements.preloader.children.preview, {
        yPercent: 100,
        ease: "back.in(1.2)",
      })
      .to(this.elements.preloader.children.prompt, {
        yPercent: -110,
      })
      .from(this.elements.focusControls.children.button, {
        autoAlpha: 0,
        yPercent: 30,
        stagger: {
          from: "start",
          grid: "auto",
          each: 0.05,
        },
        ease: "back.out(1.2)",
      })
      .to(this.elements.pokedex.element, {
        autoAlpha: 1,
      });

    this.preloaderTimeline.call(() => {
      this.elements.preloader.element.remove();
      if (!this.data.isOnBoarded) {
        this.triggerOnboarding();
      } else {
        this.elements.onBoarding.element.remove();
      }
    });
  }

  focus(area) {
    let { element, trigger } = area;

    if (this.currentFocusedArea === trigger) {
      gsap.to(this.elements.pokedex.element, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 1,
        ease: "power2.inOut",
      });
      this.currentFocusedArea = null;
      return;
    }

    this.currentFocusedArea = trigger;

    gsap.to(this.elements.pokedex.element, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        let rect = element.getBoundingClientRect();
        let x = rect.left + rect.width / 2;
        let y = rect.top + rect.height / 2;

        let centerX = window.innerWidth / 2;
        let centerY = window.innerHeight / 2;

        let padding =
          parseFloat(getComputedStyle(document.documentElement).fontSize) * 2;
        let scaleX = window.innerWidth / rect.width;
        let scaleY = (window.innerHeight - 2 * padding) / rect.height;
        let scale = Math.min(scaleX, scaleY);

        const minScale = 1.2;
        const maxScale = 2.0;
        scale = Math.max(minScale, Math.min(scale, maxScale));

        let deltaX = (centerX - x) * scale;
        let deltaY = (centerY - y) * scale;

        gsap.to(this.elements.pokedex.element, {
          x: deltaX,
          y: deltaY,
          scale: scale,
          duration: 1,
          ease: "power3.inOut",
        });
      },
    });
  }

  resetFocus() {
    gsap.to(this.elements.pokedex.element, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 1,
      ease: "power2.inOut",
    });
    this.currentFocusedArea = null;
  }

  addEventListeners() {
    this.elements.preloader.element.addEventListener("mouseover", (event) => {
      if (event.target.classList.contains("preloader__button")) {
        // check if its a touch device
        if ("ontouchstart" in window || navigator.maxTouchPoints) {
          return;
        } else {
          this.elements.preloader.children.preview.classList.add(
            "pokedex-preview--active"
          );
        }
      }
    });

    this.elements.preloader.element.addEventListener("mouseout", (event) => {
      if (event.target.classList.contains("preloader__button")) {
        // check if its a touch device
        if ("ontouchstart" in window || navigator.maxTouchPoints) {
          return;
        } else {
          this.elements.preloader.children.preview.classList.remove(
            "pokedex-preview--active"
          );
        }
      }
    });

    this.elements.preloader.element.addEventListener("click", (event) => {
      if (event.target.classList.contains("preloader__button")) {
        this.onPreloaderClick(event.target);
      }
    });

    this.elements.focusControls.element.addEventListener("click", (event) => {
      console.log(event.target.classList);
      if (event.target.classList.contains("focus-controls__button")) {
        const {
          dataset: { target },
        } = event.target;

        let area = this.elements.focusAreas.children[target];

        this.focus(area);

        // temporarily add a blink animation to the area.element to indicate focus
        gsap.to(area.element, {
          keyframes: [
            {
              opacity: 0.5,
              duration: 0.1,
            },
            {
              opacity: 1,
              duration: 0.1,
            },
          ],
        });
      }
    });

    window.addEventListener("resize", this.resetFocus.bind(this));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
