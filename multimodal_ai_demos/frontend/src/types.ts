import { z } from "zod";

export const ConfigSchema = z.object({
  functionUrl: z.string().optional(),
  offerUrl: z.string().url().optional(),
  isVideoEnabled: z.boolean(),
  videoCodec: z.enum(["default", "VP8/90000", "H264/90000"]),
  videoTransform: z.enum(["none", "edges", "cartoon", "rotate"]),
  videoResolution: z.string(),
//   videoResolution: z.enum([
//     "default",
//     "320x240",
//     "640x480",
//     "960x540",
//     "1280x720",
//   ]),
  videoInput: z.string(),
  isAudioEnabled: z.boolean(),
  audioCodec: z.enum(["default", "opus/48000/2", "PCMU/8000", "PCMA/8000"]),
  audioInput: z.string(),
  isScreenShareEnabled: z.boolean(),
  isDataEnabled: z.boolean(),
  dataParameters: z.record(z.any()),
  useStun: z.boolean()
});

export type Config = z.infer<typeof ConfigSchema>;

export const ChatMessageSchema = z.object({
    content: z.string(),
    role: z.enum(["assistant", "user"]),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;


export type DeviceOptions = { value: string; label: string }