class App {
  constructor() {
    this.isAnimating = false;
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
        children: {
          activeScreen: document.querySelector(".pokedex__active-screen"),
          activePokemon: document.querySelector(".pokedex__active-pokemon"),
          tabs: document.querySelector(".pokedex__tabs"),
          list: document.querySelector(".pokedex__list"),
          pokemon: [...document.querySelectorAll(".pokedex__pokemon-inner")],
        },
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

    this.nextPage = 0;

    this.data = {
      isOnBoarded: true,
      pokemon: {
        data: [],
        loading: false,
      },
      captured_pokemon: [],
      context: {
        name: "pokedex",
        data: {
          pokedex: [],
          captured_pokemon: [],
        },
      },
    };

    this.currentFocusedArea = null;

    this.onPreloaderClick = this.onPreloaderClick.bind(this);

    if (this.data.context.name === "captured_pokemon") {
      return;
    } else {
      this.populateData();

      this.addEventListeners();

      this.init().then(() => {
        this.populateList(this.data.context.data.pokedex);
      });
    }
  }

  async init() {
    try {
      await this.fetchPokemon();
    } catch (error) {
      console.error("Error fetching Pokémon data:", error);
    }
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

  syncData() {
    Object.keys(this.data).forEach((key) => {
      if (typeof this.data[key] === "string") {
        localStorage.setItem(key, this.data[key]);
      } else {
        localStorage.setItem(key, JSON.stringify(this.data[key]));
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
              this.data.isOnBoarded = true;
              localStorage.setItem(
                "isOnBoarded",
                JSON.stringify(this.data.isOnBoarded)
              );
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
    if (this.isAnimating) {
      gsap.killTweensOf(this.elements.pokedex.element);
    }

    if (this.currentFocusArea === area) {
      this.resetTransform();
      this.currentFocusArea = null;
      return;
    }

    let { element, trigger } = area;
    let rect = element.getBoundingClientRect();
    let pokedexRect = this.elements.pokedex.element.getBoundingClientRect();
    let x = rect.left + rect.width / 2;
    let y = rect.top + rect.height / 2;
    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;
    let currentTransform = window.getComputedStyle(
      this.elements.pokedex.element
    ).transform;
    let matrix = new WebKitCSSMatrix(currentTransform);
    let currentTranslateX = matrix.m41;
    let currentTranslateY = matrix.m42;
    let currentScale = matrix.a;

    let newScale = parseFloat(element.getAttribute("data-scale")) || 1;

    let scaleFactor = newScale / currentScale;

    let adjustedTranslateX =
      (centerX - x) * scaleFactor + currentTranslateX * scaleFactor;
    let adjustedTranslateY =
      (centerY - y) * scaleFactor + currentTranslateY * scaleFactor;

    this.isAnimating = true;
    gsap.to(this.elements.pokedex.element, {
      x: adjustedTranslateX,
      y: adjustedTranslateY,
      scale: newScale,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        this.isAnimating = false;
      },
    });

    this.currentFocusArea = area;
  }

  resetTransform() {
    gsap.to(this.elements.pokedex.element, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        this.isAnimating = false;
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

  async fetchPokemon(trigger = "") {
    const url =
      "https://pokeapi.co/api/v2/pokemon" +
      `?offset=${this.nextPage * 10}&limit=20`;

    this.data.pokemon.loading = true;

    await fetch(url)
      .then((response) => response.json())
      .then((data) => {
        this.parseData(data);
        if (trigger === "load-more") {
          this.data.context.name = "pokedex";
          this.data.context.data.pokedex = [...this.data.pokemon.data];
          return;
          this.populateList(this.data.context.data.pokedex);
        }
      })
      .catch((error) => {
        console.log("error: ", error);
      });
  }

  async fetchPokemonData(id) {
    const pokemon = this.data.context.data[this.data.context.name].find(
      (pokemon) => this.getPokemonId(pokemon.url) === Number(id)
    );

    const data = await fetch(pokemon.url);
    const response = await data.json();

    this.elements.pokedex.children.activePokemon.src =
      response["sprites"]["versions"]["generation-v"]["black-white"][
        "animated"
      ]["front_default"];

    this.elements.pokedex.children.activePokemon.alt = pokemon.name;

    document.querySelector(".pokedex__active-screen .name").textContent =
      pokemon.name;

    document.querySelector(".pokedex__active-screen .catch").disabled = false;
  }

  parseData(data) {
    const offset = data.next.match(/offset=(\d+)/)[1];
    this.data.pokemon.data = [...this.data.pokemon.data, ...data.results];
    this.nextPage = Number(offset) / 10;
    this.data.pokemon.loading = false;
    this.data.context.data.pokedex = this.data.pokemon.data.slice(0, 20);

    this.syncData();
  }

  getPokemonId(url) {
    return Number(
      url.substring(
        url.substring(0, url.length - 2).lastIndexOf("/") + 1,
        url.length - 1
      )
    );
  }

  populateList(data) {
    return;
    const poke = [];

    console.log(data);

    data.forEach((pokemon) => {
      const isCaptured = this.data.context.data.captured_pokemon.find(
        (poke) => poke.name === pokemon.name
      );

      poke.push(`
      	<div class="pokedex__pokemon-inner ${
          isCaptured && "captured"
        }" data-name="${pokemon.name}" data-id="${this.getPokemonId(
        pokemon.url
      )}">
      		<div class="pokedex__pokemon-image">
      			<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.getPokemonId(
              pokemon.url
            )}.png" alt="${pokemon.name}" />
      		</div>
      	</div>
      `);
    });

    this.elements.pokedex.children.list.innerHTML = "";

    this.elements.pokedex.children.list.innerHTML = poke.join("");
  }

  addEventListeners() {
    this.elements.preloader.element.addEventListener("mouseover", (event) => {
      if (event.target.classList.contains("preloader__button")) {
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
      if (event.target.classList.contains("focus-controls__button")) {
        const {
          dataset: { target },
        } = event.target;

        let area = this.elements.focusAreas.children[target];

        this.focus(area);

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

    this.elements.pokedex.children.tabs.addEventListener("click", (event) => {
      if (event.target.classList.contains("pokedex__tab--more")) {
        this.fetchPokemon("load-more");
      } else if (event.target.classList.contains("pokedex__tab--captured")) {
        console.log("show captured pokemon");
        this.data.context.name = "captured_pokemon";
        this.syncData();
        this.populateList(this.data.context.data.captured_pokemon);
      } else if (event.target.classList.contains("pokedex__tab--pokedex")) {
        console.log("show pokedex");
        this.data.context.name = "pokedex";
        this.syncData();
        this.populateList(this.data.context.data.pokedex);
      } else {
        return;
      }
    });

    window.addEventListener("resize", this.resetFocus.bind(this));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
