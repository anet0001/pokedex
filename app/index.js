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
            element: document.querySelector("#pokedex .pokedex__list"),
            trigger: document.querySelector(
              ".focus-controls__button[data-target='pokedex-list']"
            ),
          },
        },
      },
      focusControls: document.querySelectorAll(".focus-controls__button"),
    };

    // local storage data handler
    this.data = {
      isOnBoarded: false,
    };

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
        // ease to make it softer
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
    // disable button
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
      .from(this.elements.focusControls, {
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
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
