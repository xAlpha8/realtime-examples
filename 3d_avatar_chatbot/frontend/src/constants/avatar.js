/**
 * A collection of predefined facial expressions with their corresponding morph target influences.
 *
 * Each key represents an expression, and the associated value is an object where keys represent
 * facial morph targets (e.g., 'browInnerUp', 'mouthSmileLeft') and the values are the intensities
 * (ranging from 0 to 1) for those morph targets.
 */
export const FACIAL_EXPRESSIONS = {
  default: {}, // Default expression with no morph target changes
  smile: {
    browInnerUp: 0.17,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.44,
    noseSneerLeft: 0.1700000727403593,
    noseSneerRight: 0.14000002836874015,
    mouthPressLeft: 0.61,
    mouthPressRight: 0.41000000000000003,
  },
  funnyFace: {
    jawLeft: 0.63,
    mouthPucker: 0.53,
    noseSneerLeft: 1,
    noseSneerRight: 0.39,
    mouthLeft: 1,
    eyeLookUpLeft: 1,
    eyeLookUpRight: 1,
    cheekPuff: 0.9999924982764238,
    mouthDimpleLeft: 0.414743888682652,
    mouthRollLower: 0.32,
    mouthSmileLeft: 0.35499733688813034,
    mouthSmileRight: 0.35499733688813034,
  },
  sad: {
    mouthFrownLeft: 1,
    mouthFrownRight: 1,
    mouthShrugLower: 0.78341,
    browInnerUp: 0.452,
    eyeSquintLeft: 0.72,
    eyeSquintRight: 0.75,
    eyeLookDownLeft: 0.5,
    eyeLookDownRight: 0.5,
    jawForward: 1,
  },
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    jawForward: 1,
    jawLeft: 1,
    mouthShrugLower: 1,
    noseSneerLeft: 1,
    noseSneerRight: 0.42,
    eyeLookDownLeft: 0.16,
    eyeLookDownRight: 0.16,
    cheekSquintLeft: 1,
    cheekSquintRight: 1,
    mouthClose: 0.23,
    mouthFunnel: 0.63,
    mouthDimpleRight: 1,
  },
  crazy: {
    browInnerUp: 0.9,
    jawForward: 1,
    noseSneerLeft: 0.5700000000000001,
    noseSneerRight: 0.51,
    eyeLookDownLeft: 0.39435766259644545,
    eyeLookUpRight: 0.4039761421719682,
    eyeLookInLeft: 0.9618479575523053,
    eyeLookInRight: 0.9618479575523053,
    jawOpen: 0.9618479575523053,
    mouthDimpleLeft: 0.9618479575523053,
    mouthDimpleRight: 0.9618479575523053,
    mouthStretchLeft: 0.27893590769016857,
    mouthStretchRight: 0.2885543872656917,
    mouthSmileLeft: 0.5578718153803371,
    mouthSmileRight: 0.38473918302092225,
    tongueOut: 0.9618479575523053,
  },
};

/**
 * A mapping of message cues to corresponding avatar mesh morph targets.
 *
 * Each key represents a message cue, and the associated value is the name of the morph target
 * that should be activated on the avatar mesh in response to that cue.
 */
export const MAP_RHUBARB_VISEME_ID_TO_AVATAR_MESH = {
  A: "PP",
  B: "kk",
  C: "I",
  D: "AA",
  E: "O",
  F: "U",
  G: "FF",
  H: "TH",
  X: "PP",
};

export const MAP_AZURE_VISEME_ID_TO_AVATAR_MESH = {
  0: "sil",
  1: "AA",
  2: "AA",
  3: "O",
  4: "E",
  5: "RR",
  6: "I",
  7: "O",
  8: "O",
  9: "U",
  10: "O",
  11: "AA",
  12: "CH",
  13: "U",
  14: "nn",
  15: "SS",
  16: "CH",
  17: "TH",
  18: "FF",
  19: "DD",
  20: "kk",
  21: "PP",
};
