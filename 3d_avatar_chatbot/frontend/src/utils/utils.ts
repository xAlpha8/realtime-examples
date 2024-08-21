import { snakeCase } from "snake-case";

export const blobToBase64 = (blob: Blob): Promise<string | null> => {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(reader.result?.toString().split(",")[1] || null);
    reader.readAsDataURL(blob);
  });
};

export const stringify = (obj: Object): string => {
  return JSON.stringify(obj, function (key, value) {
    if (value && typeof value === "object") {
      var replacement: { [key: string]: any } = {};
      for (var k in value) {
        if (Object.hasOwnProperty.call(value, k)) {
          replacement[k && snakeCase(k.toString())] = value[k];
        }
      }
      return replacement;
    }
    return value;
  });
};

async function delay(delayInms: number) {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
}

export async function retryableConnect(
  url: string,
  params: RequestInit,
  attempts: number
) {
  let mult = 1;
  console.log("Connecting to ", url);
  const offerURL = url.replace("https://", "wss://");
  for (let i = 0; i < attempts; ++i) {
    try {
      let res = await fetch(url + "/connections", params);
      console.log("res", res);
      const socket = new WebSocket(offerURL);
      return socket;
    } catch (err) {
      console.log("Error connecting to ", url, ". Retrying...");
      await delay(mult * 1000);
      mult *= 2;
      if (i == attempts - 1) {
        throw err;
      }
    }
  }
}
