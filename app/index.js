class App {
  constructor() {
    this.elements = {};
    console.log("App Initialized");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
