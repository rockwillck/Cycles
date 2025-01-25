let installPrompt = null;
const installButton = document.querySelector("#install");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  console.log("hi")
  installPrompt = event;
  installButton.removeAttribute("hidden");
});