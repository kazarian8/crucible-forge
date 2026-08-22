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

/**
 * Picture Furnace pricing is intentionally action-specific. Keep this map as
 * the single source of truth used by both the UI and the server route.
 */
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
  return PICTURE_ACTION_PRICES[command] ?? DEFAULT_PICTURE_ACTION_PRICE;
}
