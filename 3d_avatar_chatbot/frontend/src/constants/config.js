/**
 * The default configuration for initializing a connection or service.
 *
 * @type {Object}
 * @property {string} functionUrl - The URL of the function endpoint.
 * @property {string} offerUrl - The URL used to make offers for connections.
 * @property {boolean} isDataEnabled - Indicates if data channels are enabled.
 * @property {Object} dataParameters - Parameters for the data channels.
 * @property {boolean} dataParameters.ordered - Whether the data should be delivered in order.
 * @property {boolean} isVideoEnabled - Indicates if video is enabled.
 * @property {string} videoInput - The video input device to use.
 * @property {string} videoCodec - The video codec to use.
 * @property {string} videoResolution - The resolution of the video (e.g., "256x256").
 * @property {string} videoTransform - The video transform to apply (e.g., "none").
 * @property {boolean} isScreenShareEnabled - Indicates if screen sharing is enabled.
 * @property {boolean} isAudioEnabled - Indicates if audio is enabled.
 * @property {string} audioInput - The audio input device to use.
 * @property {string} audioCodec - The audio codec to use (e.g., "PCMU/8000").
 * @property {boolean} useStun - Indicates if a STUN server should be used for the connection.
 */
export const DEFAULT_CONFIG = {
  functionUrl: "https://us0-dev.getadapt.ai/run/0880a3a92efcb3b4b4afeb06f29ccf83", // Function endpoint URL
  offerUrl: "http://0.0.0.0:8080/", // URL to make offers for connections
  isDataEnabled: true, // Enable or disable data channels
  dataParameters: { ordered: true }, // Data channel parameters, e.g., ordered delivery
  isVideoEnabled: false, // Enable or disable video
  videoInput: "", // Video input device (empty string for default)
  videoCodec: "default", // Codec to use for video
  videoResolution: "256x256", // Resolution of the video
  videoTransform: "none", // Transformation to apply to the video
  isScreenShareEnabled: false, // Enable or disable screen sharing
  isAudioEnabled: true, // Enable or disable audio
  audioInput: "", // Audio input device (empty string for default)
  audioCodec: "PCMU/8000", // Codec to use for audio
  useStun: false, // Enable or disable use of a STUN server for the connection
};
