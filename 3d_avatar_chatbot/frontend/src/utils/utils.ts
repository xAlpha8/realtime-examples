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
  url: string | URL,
  params: RequestInit,
  attempts: number
) {
  let mult = 1;
  for (let i = 0; i < attempts; ++i) {
    try {
      let res = new WebSocket(url);
      return res;
    } catch (err) {
      await delay(mult * 1000);
      mult *= 2;
      if (i == attempts - 1) {
        throw err;
      }
    }
  }
}
