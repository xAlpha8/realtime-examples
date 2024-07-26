class AdaptEmbed {
  constructor() {
    this.chatButton = document.createElement("div");
    this.chatboxContainer = document.createElement("div");
    this.openState = false;

    this.src = new URL("https://realtime-showcase.pages.dev/avatar");
  }

  embedChatButton() {
    const chatButton = this.chatButton;
    chatButton.id = "adapt-popup-button";
    chatButton.innerHTML = `
          <div class="adapt-popup-open">
              <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M4 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1v2a1 1 0 0 0 1.707.707L9.414 13H15a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Z" clip-rule="evenodd"/>
              <path fill-rule="evenodd" d="M8.023 17.215c.033-.03.066-.062.098-.094L10.243 15H15a3 3 0 0 0 3-3V8h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1v2a1 1 0 0 1-1.707.707L14.586 18H9a1 1 0 0 1-.977-.785Z" clip-rule="evenodd"/>
              </svg>
          </div>
          <div class="adapt-popup-close">
              <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
              </svg>
          </div>`;

    document.body.appendChild(chatButton);

    const chatButtonStyle = document.createElement("style");
    chatButtonStyle.innerHTML = `
      #adapt-popup-button {
          align-items: center;
          background-color: orange;
          border-radius: 5px;
          box-shadow: 3px 3px 5px gray;
          bottom: 10px;
          color: white;
          cursor: pointer;
          display: block;
          height: 50px;
          justify-content: center;
          opacity: 1;
          position: fixed;
          right: 10px;
          text-align: center;
          transition: all 250ms ease-out;
          vertical-align: middle;
          width: 50px;
          z-index:99999;
      }
  
      #adapt-popup-button > .adapt-popup-close {
          display: none;
      }
  
      #adapt-popup-button:hover {
          background-color: red;
          /* Add hover styles here */
      }
  
      #adapt-popup-button.clicked > .adapt-popup-open {
          display: none;
      }
  
      #adapt-popup-button.clicked > .adapt-popup-close {
          display: block;
      }
  
      #adapt-popup-button.clicked:hover {
          /* Add styles for when the button has 'clicked' class and is hovered */
      }
      `;

    document.head.appendChild(chatButtonStyle);
  }

  embedChatbox() {
    const chatboxContainer = this.chatboxContainer;
    chatboxContainer.id = "adapt-chatbox-container";

    chatboxContainer.innerHTML = `
          <div id="adapt-chatbox-close"></div>
          <iframe id="adapt-chatbox-iframe" src=${this.src} frameBorder="0" allow="microphone"></iframe>
      `;

    const chatboxContainerStyle = document.createElement("style");
    chatboxContainerStyle.innerHTML = `
      #adapt-chatbox-container {
          align-items: center;
          bottom: 80px;
          height: 520px;
          color: white;
          cursor: pointer;
          display: none;
          justify-content: center;
          opacity: 1;
          position: fixed;
          right: 10px;
          text-align: center;
          transition: all 250ms ease-out;
          vertical-align: middle;
          z-index:99999;
      }
  
      #adapt-chatbox-container.active {
          display: block;
      }
  
      #adapt-chatbox-iframe {
          height: 100%;
      }
      `;
    document.head.appendChild(chatboxContainerStyle);
    document.body.appendChild(chatboxContainer);
  }

  addListeners() {
    const chatButton = this.chatButton;
    const chatboxContainer = this.chatboxContainer;
    chatButton.addEventListener("click", () => {
      this.openState = !this.openState;
      if (this.openState) {
        chatButton.classList.add("clicked");
        chatboxContainer.classList.add("active");
      } else {
        chatButton.classList.remove("clicked");
        chatboxContainer.classList.remove("active");
      }
    });
  }
}

const runAdapt = () => {
  console.log("[Adapt] Running adapt embed");
  adapt = new AdaptEmbed();
  adapt.embedChatButton();
  adapt.embedChatbox();
  adapt.addListeners();
};
