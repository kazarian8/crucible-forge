export const promptReforgeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
    },
    summary: {
      type: "string",
    },
    visual_dna: {
      type: "object",
      additionalProperties: false,
      properties: {
        concept: { type: "string" },
        mood: { type: "string" },
        subjects: {
          type: "array",
          items: { type: "string" },
        },
        environment: { type: "string" },
        camera: { type: "string" },
        lighting: { type: "string" },
        color_palette: {
          type: "array",
          items: { type: "string" },
        },
        editing_style: { type: "string" },
        effects: {
          type: "array",
          items: { type: "string" },
        },
        audio_direction: { type: "string" },
      },
      required: [
        "concept",
        "mood",
        "subjects",
        "environment",
        "camera",
        "lighting",
        "color_palette",
        "editing_style",
        "effects",
        "audio_direction"
      ],
    },
    master_prompt: {
      type: "string",
    },
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          scene_number: { type: "integer" },
          estimated_time: { type: "string" },
          description: { type: "string" },
          shot_type: { type: "string" },
          camera_movement: { type: "string" },
          lighting: { type: "string" },
          action: { type: "string" },
          transition: { type: "string" },
          generation_prompt: { type: "string" },
        },
        required: [
          "scene_number",
          "estimated_time",
          "description",
          "shot_type",
          "camera_movement",
          "lighting",
          "action",
          "transition",
          "generation_prompt"
        ],
      },
    },
    platform_prompts: {
      type: "object",
      additionalProperties: false,
      properties: {
        capcut: { type: "string" },
        sora: { type: "string" },
        veo: { type: "string" },
        kling: { type: "string" },
        runway: { type: "string" },
      },
      required: ["capcut", "sora", "veo", "kling", "runway"],
    },
    negative_prompt: {
      type: "string",
    },
    editing_recipe: {
      type: "array",
      items: { type: "string" },
    },
    continuity_rules: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "title",
    "summary",
    "visual_dna",
    "master_prompt",
    "scenes",
    "platform_prompts",
    "negative_prompt",
    "editing_recipe",
    "continuity_rules"
  ],
} as const;
