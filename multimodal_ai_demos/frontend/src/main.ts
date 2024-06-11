import "./style.css";

import { setupRealtime } from "./realtime.ts";
import forwardIcon from "./icons/noun-forward.svg";
import arrowIcon from "./icons/noun-pixel-arrow.svg";
import crossIcon from "./icons/noun-pixel-cross.svg";
import settingsIconDark from "./icons/noun-pixel-cog-dark.svg";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = 
`
<div id="realtime-container" class="md:h-screen">

  <!-- Modal -->
  <dialog class="nes-dialog" id="settings-modal">
    <form method="dialog">
      <div id="select-input-form-header" class="text-lg text-center mb-4">
        <p>Select Inputs</p>
      </div>
      <div class="mb-4 text-sm">
        <div class="nes-field">
          <label for="fnurl_field">Function URL</label>
          <input type="text" id="fnurl_field" class="nes-input">
        </div>
      </div>
      <div class="mb-4 text-sm">
        <label for="audio-select">Select Audio Input</label>
        <div class="nes-select">
          <select id="audio-select">
              <option value="" selected>No Audio</option>
          </select>
        </div>
      </div>
      <div class="mb-4 text-sm">
        <label for="video-select">Select Video Input</label>
        <div class="nes-select">
          <select id="video-select">
              <option value="" selected>No Video</option>
          </select>
        </div>
      </div>
      <div class="mb-4 text-sm">
        <label for="resolution-select">Select Video Resolution</label>
        <div class="nes-select">
          <select id="resolution-select">
              <option value="256x256" selected>256x256</option>
              <option value="512x512">512x512</option>
              <option value="1024x1024">1024x1024</option>
              <option value="2048x2048">2048x2048</option>
          </select>
        </div>
      </div>
      <div>
        <label>
          <input type="checkbox" class="nes-checkbox" id="use-datachannel" />
          <span>Enable Datachannel</span>
        </label>
        <label>
          <input type="checkbox" class="nes-checkbox" id="use-stun" />
          <span>Enable Stun</span>
        </label>
      </div>
      <menu class="dialog-menu flex flex-row gap-4">
        <button class="nes-btn">Close</button>
      </menu>
    </form>
  </dialog>

  <!-- Header -->
  <div class="max-h-48 p-4 flex justify-between items-center">
    <div class="flex gap-1 items-center">
      <h1 class="text-xl font-bold">Realtime</h1>
      <img src="${forwardIcon}" class="h-8" alt="Realtime logo" />
    </div>
    <div class="flex gap-1 items-center">
      <button type="button" class="nes-btn is-warning p-0" id="settings-button">
      <img src="${settingsIconDark}" class="h-8" alt="Open Settings" />
      </button>
      <button type="button" class="nes-btn is-primary p-0 sm:hidden" id="start-button-sm">
          <img src="${arrowIcon}" class="h-8" alt="Start Program" />
      </button>
      <button type="button" class="nes-btn is-primary sm:inline-block hidden" id="start-button">
          Start
      </button>
      <button type="button" class="nes-btn is-error p-0 sm:hidden hidden" id="stop-button-sm">
          <img src="${crossIcon}" class="h-8" alt="Stop Program" />
      </button>
      <button
          type="button"
          class="nes-btn is-error sm:inline-block hidden"
          id="stop-button"
      >
          Stop
      </button>
    </div>
  </div>

  <!-- Main Content -->
  <div class="grid grid-cols-4 grid-rows-4 md:grid-rows-2 gap-4 md:h-5/6 mx-4 h-[48rem]">
    <div
      class="col-span-4 md:col-span-3 row-span-2 border border-solid  border-black rounded-md flex justify-center items-center overflow-hidden"
      id="video-container"
    >
      <div class="nes-text is-disabled media-container-label">Video</div>
      <video
        id="video"
        autoplay="true"
        playsinline="true"
        style="display: none"
      ></video>
    </div>

    <!-- Top Right Section -->
    <div
      class="col-span-4 md:col-span-1 row-span-1 border border-solid hover:border-dashed border-black rounded-md flex flex-col"
    >
      <div id="audio-container" class="h-full flex items-center justify-center">
        <div class="nes-text is-disabled media-container-label">Audio</div>
        <audio id="audio" autoplay="true" style="display: none"></audio>
        <div id="audio-visualizer-container" class="h-full"></div>
      </div>
    </div>

    <!-- Bottom Right Section -->
    <div
      class="col-span-4 md:col-span-1 row-span-1 border border-solid hover:border-dashed border-black rounded-md flex flex-col"
    >
      <section id="chat-container" class="nes-container p-0 border-0 overflow-y-scroll h-full flex justify-center items-center">
        <div class="nes-text is-disabled media-container-label">Chat</div>
        <section
          class="message-list text-xs"
          id="chat-messages"
        ></section>
      </section>
    </div>
    </div>

    <!-- Footer -->
    <div class="max-h-48 p-4 flex justify-center gap-4 items-center">
      <div>
        <p class="text-sm">$ realtime deploy</p>
      </div>
    </div>
  </div>
</div>
`;

setupRealtime(document.querySelector<HTMLDivElement>("#realtime-container"), {
  functionUrl: "",
  offerUrl:`http://localhost:8080/offer`,
  isDataEnabled: false,
  dataParameters: { ordered: true },
  isVideoEnabled: false,
  videoInput: "",
  videoCodec: "default",
  videoResolution: "256x256",
  videoTransform: "none",
  isScreenShareEnabled: false,
  isAudioEnabled: false,
  audioInput: "",
  audioCodec: "PCMU/8000",
  useStun: false,
});
