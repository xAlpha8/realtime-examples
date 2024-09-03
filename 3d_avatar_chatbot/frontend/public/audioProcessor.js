class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = this.handleMessage.bind(this);
    this.audioData = [];
    this.index = 0;
    this.isTalking = false;
  }

  /**
   * Handles incoming messages from the main thread.
   * @param {MessageEvent} event - The message event containing audio data.
   */
  async handleMessage(event) {
    if (event.data.type === "arrayBuffer") {
      try {
        // Decode the audio data
        const audioData = await this.decodeAudio(event.data.buffer);
        this.audioData.push(audioData);
      } catch (error) {
        this.port.postMessage({
          type: "error",
          message: "Audio decoding failed: " + error,
        });
        this.isTalking = false;
        this.port.postMessage("agent_stop_talking");
      }
    }
  }

  /**
   * Decodes the audio data from an ArrayBuffer.
   * @param {ArrayBuffer} arrayBuffer - The raw audio data.
   * @returns {Promise<Float32Array>} The decoded audio data.
   */
  async decodeAudio(arrayBuffer) {
    // Note: AudioContext is not available in AudioWorkletGlobalScope
    // We'll use a simple PCM decoder for this example
    // In a real-world scenario, you might want to use a more robust decoder library
    const dataArray = new Uint8Array(arrayBuffer);
    const view = new DataView(dataArray.buffer);
    const pcmData = new Float32Array(dataArray.byteLength / 2);
    for (let i = 0; i < pcmData.length; i++) {
      pcmData[i] = view.getInt16(i * 2, true) / Math.pow(2, 16 - 1);
    }
    return pcmData;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        if (this.audioData.length > 0) {
          if (!this.isTalking) {
            this.isTalking = true;
            this.port.postMessage("agent_start_talking");
          }
          outputChannel[i] = this.audioData[0][this.index];
          this.index++;
          if (this.index == this.audioData[0].length) {
            this.audioData.shift();
            this.index = 0;
          }
        } else {
          outputChannel[i] = 0;
          if (this.isTalking) {
            this.isTalking = false;
            this.port.postMessage("agent_stop_talking");
          }
        }
      }
    }
    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
