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

export const PICTURE_ACTION_PRICES = {
  "Enhance Natural": 5,
  "Enhance Blurry Image": 10,
  "Enhance Beauty": 8,
  "Remove Background": 6,
  "Replace Object": 9,
  "Remove Object": 7,
  "Add Object": 9,
  "Change Object Color": 6,
  "Change Background": 10,
  "Blur Background": 5,
  "Restore Photo": 15,
  "Colorize Photo": 10,
  "Sharpen": 3,
  "Denoise": 4,
  "Brighten": 3,
  "Fix Lighting": 5,
  "Fix Color": 4,
  "Crop": 2,
  "Expand Image": 12,
  "Straighten": 2,
  "Rotate": 2,
  "Flip": 2,
  "Add Text": 5,
  "Remove Text": 7,
  "Add Logo": 6,
  "Add Sticker": 5,
  "Black & White": 3,
  "Vivid": 3,
  "Warm": 3,
  "Cool": 3,
  "Noir": 4,
  "Pencil Drawing": 8,
  "Oil Painting": 10,
  "Custom Image Edit": 8,
} as const;

export type PictureAction = keyof typeof PICTURE_ACTION_PRICES;

export type PictureActionQuote = {
  action: PictureAction;
  cost: number;
  description: string;
};

function quote(action: PictureAction, description: string): PictureActionQuote {
  return { action, cost: PICTURE_ACTION_PRICES[action], description };
}

/**
 * Interprets natural-language Picture Furnace commands into a canonical edit
 * category and price. Both the browser and server use this function so the
 * confirmation shown to the user always matches the amount charged.
 */
export function classifyPictureAction(command: string): PictureActionQuote {
  const raw = command.trim();
  const value = raw.toLowerCase();

  if (!value) return quote("Custom Image Edit", "custom image edit");

  if (/\b(enhance|fix|clear|restore)\b.*\b(blurry|blurred|out of focus|low resolution|pixelated)\b|\b(deblur|unblur)\b/.test(value)) {
    return quote("Enhance Blurry Image", "enhance a blurry image");
  }
  if (/\b(beauty|beautify|retouch|skin smoothing|portrait polish|face polish)\b/.test(value)) {
    return quote("Enhance Beauty", "beauty enhancement");
  }
  if (/\b(remove|erase|cut out)\b.*\bbackground\b|\btransparent background\b/.test(value)) {
    return quote("Remove Background", "remove the background");
  }
  if (/\b(blur|soften)\b.*\bbackground\b|\bbackground\b.*\b(blur|soften)\b/.test(value)) {
    return quote("Blur Background", "blur the background");
  }
  if (/\b(change|replace|swap)\b.*\bbackground\b/.test(value)) {
    return quote("Change Background", "change the background");
  }
  if (/\b(restore|repair|fix)\b.*\b(old|damaged|vintage|scratched|torn|faded|photo|picture)\b/.test(value)) {
    return quote("Restore Photo", "restore the photo");
  }
  if (/\b(colorize|colourize|add color to black|add colour to black)\b/.test(value)) {
    return quote("Colorize Photo", "colorize the photo");
  }
  if (/\b(pencil|sketch|pencil drawing)\b/.test(value)) {
    return quote("Pencil Drawing", "turn the image into a pencil drawing");
  }
  if (/\b(oil painting|oil paint|painted portrait|painting style)\b/.test(value)) {
    return quote("Oil Painting", "turn the image into an oil painting");
  }
  if (/\b(remove|erase|delete)\b.*\b(text|words|caption|writing)\b/.test(value)) {
    return quote("Remove Text", "remove text");
  }
  if (/\b(add|insert|put)\b.*\b(text|words|caption|writing)\b/.test(value)) {
    return quote("Add Text", "add text");
  }
  if (/\b(add|insert|put)\b.*\blogo\b/.test(value)) {
    return quote("Add Logo", "add a logo");
  }
  if (/\b(add|insert|put)\b.*\bsticker\b/.test(value)) {
    return quote("Add Sticker", "add a sticker");
  }
  if (/\b(change|make|turn)\b.*\b(color|colour)\b.*\b(of|on|for)\b|\bchange\b.*\bto (red|blue|green|black|white|orange|yellow|purple|pink|gray|grey|brown)\b/.test(value)) {
    return quote("Change Object Color", "change an object's color");
  }
  if (/\b(replace|swap)\b/.test(value)) {
    return quote("Replace Object", "replace an object");
  }
  if (/\b(remove|erase|delete)\b/.test(value)) {
    return quote("Remove Object", "remove an object");
  }
  if (/\b(add|insert|put)\b/.test(value)) {
    return quote("Add Object", "add an object");
  }
  if (/\b(expand|outpaint|extend canvas|extend image)\b/.test(value)) {
    return quote("Expand Image", "expand the image");
  }
  if (/\b(crop|trim image|trim photo)\b/.test(value)) {
    return quote("Crop", "crop the image");
  }
  if (/\bstraighten\b/.test(value)) {
    return quote("Straighten", "straighten the image");
  }
  if (/\brotate\b/.test(value)) {
    return quote("Rotate", "rotate the image");
  }
  if (/\bflip\b/.test(value)) {
    return quote("Flip", "flip the image");
  }
  if (/\b(sharpen|make sharper|more sharp)\b/.test(value)) {
    return quote("Sharpen", "sharpen the image");
  }
  if (/\b(denoise|remove noise|reduce noise|remove grain|reduce grain)\b/.test(value)) {
    return quote("Denoise", "reduce image noise");
  }
  if (/\b(brighten|brighter|raise exposure|increase exposure)\b/.test(value)) {
    return quote("Brighten", "brighten the image");
  }
  if (/\b(lighting|highlights|shadows|exposure balance)\b/.test(value)) {
    return quote("Fix Lighting", "fix the lighting");
  }
  if (/\b(fix color|fix colour|color balance|colour balance|white balance|color cast|colour cast)\b/.test(value)) {
    return quote("Fix Color", "fix the color");
  }
  if (/\b(black and white|black & white|grayscale|greyscale|monochrome)\b/.test(value)) {
    return quote("Black & White", "convert to black and white");
  }
  if (/\bnoir\b/.test(value)) {
    return quote("Noir", "apply a noir treatment");
  }
  if (/\bvivid\b/.test(value)) {
    return quote("Vivid", "apply a vivid treatment");
  }
  if (/\bwarm\b/.test(value)) {
    return quote("Warm", "apply a warm treatment");
  }
  if (/\bcool\b/.test(value)) {
    return quote("Cool", "apply a cool treatment");
  }
  if (/\b(enhance|improve|clean up|clean-up|make clearer|clear up)\b/.test(value)) {
    return quote("Enhance Natural", "enhance the image naturally");
  }

  return quote("Custom Image Edit", raw.length > 70 ? `${raw.slice(0, 67)}...` : raw);
}

export function getPictureActionPrice(command: string) {
  return classifyPictureAction(command).cost;
}
