export const CREDIT_PRICES = {
  quickMaster: 0,
  promptReforge: 250,
  stemSeparation: 500,
  engineerMode: 0,
  export24Bit: 0,
  usernameChange: 100,
  usernameFontChange: 25,
} as const;

export const CREDIT_SERVICE_LABELS = {
  quickMaster: "Quick Master",
  promptReforge: "Prompt Reforge",
  stemSeparation: "Six-stem separation",
  engineerMode: "Engineer Mode",
  export24Bit: "24-bit export",
  usernameChange: "Username change",
  usernameFontChange: "Username font change",
} as const;

export type CreditService = keyof typeof CREDIT_PRICES;

export const PICTURE_ACTION_PRICES: Record<string, number> = {
  "Enhance Natural": 5,
  "Enhance Blurry Image": 10,
  "Enhance Beauty": 8,
  "Remove Background": 6,
  "Replace [item] with [color + item]": 9,
  "Remove [item]": 7,
  "Add [item]": 9,
  "Change Color of [item] to [color]": 6,
  "Change Background to [description]": 10,
  "Blur Background": 5,
  "Restore Photo": 15,
  "Colorize Photo": 10,
  "Sharpen": 3,
  "Denoise": 4,
  "Brighten": 3,
  "Fix Lighting": 5,
  "Fix Color": 4,
  "Crop [ratio]": 2,
  "Expand Image [direction/ratio]": 12,
  "Straighten": 2,
  "Rotate [left/right]": 2,
  "Flip [horizontal/vertical]": 2,
  "Add Text [text]": 5,
  "Remove Text": 7,
  "Add Logo [logo]": 6,
  "Add Sticker [sticker]": 5,
  "Black & White": 3,
  "Vivid": 3,
  "Warm": 3,
  "Cool": 3,
  "Noir": 4,
  "Pencil Drawing": 8,
  "Oil Painting": 10,
};

export const DEFAULT_PICTURE_ACTION_PRICE = 8;

export function getPictureActionPrice(command: string) {
  if (PICTURE_ACTION_PRICES[command] !== undefined) return PICTURE_ACTION_PRICES[command];

  const value = command.trim().toLowerCase();
  if (!value) return DEFAULT_PICTURE_ACTION_PRICE;

  if (value.includes("enhance blurry") || value.includes("deblur") || value.includes("unblur")) return 10;
  if (value.includes("enhance beauty") || value.includes("beauty")) return 8;
  if (value.includes("enhance") || value.includes("improve photo") || value.includes("improve image")) return 5;
  if (value.includes("remove background") || value.includes("transparent background")) return 6;
  if (value.includes("change background") || value.includes("replace background")) return 10;
  if (value.includes("blur background")) return 5;
  if (value.includes("restore") || value.includes("repair old") || value.includes("repair photo")) return 15;
  if (value.includes("colorize") || value.includes("colourize")) return 10;
  if (value.includes("sharpen")) return 3;
  if (value.includes("denoise") || value.includes("remove noise") || value.includes("reduce noise")) return 4;
  if (value.includes("brighten")) return 3;
  if (value.includes("lighting")) return 5;
  if (value.includes("fix color") || value.includes("colour") || value.includes("color balance")) return 4;
  if (value.includes("crop")) return 2;
  if (value.includes("expand") || value.includes("outpaint")) return 12;
  if (value.includes("straighten")) return 2;
  if (value.includes("rotate")) return 2;
  if (value.includes("flip")) return 2;
  if (value.includes("remove text")) return 7;
  if (value.includes("add text")) return 5;
  if (value.includes("logo")) return 6;
  if (value.includes("sticker")) return 5;
  if (value.includes("black and white") || value.includes("black & white") || value.includes("grayscale")) return 3;
  if (value.includes("pencil")) return 8;
  if (value.includes("oil painting") || value.includes("painted")) return 10;
  if (value.includes("noir")) return 4;
  if (value.includes("vivid") || value.includes("warm") || value.includes("cool")) return 3;
  if (value.startsWith("remove ")) return 7;
  if (value.startsWith("add ") || value.includes(" add ")) return 9;
  if (value.includes("replace") || value.includes("change ")) return 9;

  return DEFAULT_PICTURE_ACTION_PRICE;
}
