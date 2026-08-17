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
