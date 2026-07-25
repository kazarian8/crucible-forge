export const promptReforgeSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    title: {
      type: "string",
      description: "A short title describing the analyzed video.",
    },

    summary: {
      type: "string",
      description:
        "A concise explanation of the video's overall concept and production style.",
    },

    visual_dna: {
      type: "object",
      additionalProperties: false,

      properties: {
        concept: {
          type: "string",
          description: "The central creative concept of the video.",
        },

        mood: {
          type: "string",
          description: "The emotional tone and atmosphere.",
        },

        subjects: {
          type: "array",
          items: {
            type: "string",
          },
          description:
            "The main people, objects, clothing, props, or subjects shown.",
        },

        environment: {
          type: "string",
          description:
            "The setting, location, background, scenery, and environment.",
        },

        camera: {
          type: "string",
          description:
            "Camera angles, framing, shot types, lens characteristics, and movement.",
        },

        lighting: {
          type: "string",
          description:
            "Lighting direction, softness, shadows, contrast, and practical lights.",
        },

        color_palette: {
          type: "array",
          items: {
            type: "string",
          },
          description:
            "The dominant colors and overall color-grading direction.",
        },

        editing_style: {
          type: "string",
          description:
            "The pacing, cutting style, timing, speed ramps, and transitions.",
        },

        effects: {
          type: "array",
          items: {
            type: "string",
          },
          description:
            "Visible effects, overlays, particles, typography, filters, or graphics.",
        },

        audio_direction: {
          type: "string",
          description:
            "Suggested music energy, sound effects, ambience, and synchronization.",
        },
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
        "audio_direction",
      ],
    },

    master_prompt: {
      type: "string",
      description:
        "A complete production-ready prompt for recreating a visually similar but original video.",
    },

    scenes: {
      type: "array",
      description:
        "A chronological breakdown of the individual scenes or major shots.",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          scene_number: {
            type: "integer",
            description: "The chronological number of the scene.",
          },

          estimated_time: {
            type: "string",
            description:
              "The approximate beginning and ending time of the scene.",
          },

          description: {
            type: "string",
            description: "A visual description of what occurs in the scene.",
          },

          shot_type: {
            type: "string",
            description:
              "The framing, camera angle, composition, or lens appearance.",
          },

          camera_movement: {
            type: "string",
            description:
              "The camera movement, such as static, pan, tilt, dolly, zoom, or handheld.",
          },

          lighting: {
            type: "string",
            description: "The lighting setup used for the scene.",
          },

          action: {
            type: "string",
            description:
              "The movement or action performed by the subjects or environment.",
          },

          transition: {
            type: "string",
            description:
              "The transition used to enter or leave the scene.",
          },

          generation_prompt: {
            type: "string",
            description:
              "A complete standalone AI-video prompt for generating this scene.",
          },
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
          "generation_prompt",
        ],
      },
    },

    platform_prompts: {
      type: "object",
      additionalProperties: false,

      properties: {
        capcut: {
          type: "string",
          description:
            "A prompt and editing direction optimized for CapCut.",
        },

        sora: {
          type: "string",
          description: "A video-generation prompt optimized for Sora.",
        },

        veo: {
          type: "string",
          description: "A video-generation prompt optimized for Veo.",
        },

        kling: {
          type: "string",
          description: "A video-generation prompt optimized for Kling.",
        },

        runway: {
          type: "string",
          description: "A video-generation prompt optimized for Runway.",
        },
      },

      required: ["capcut", "sora", "veo", "kling", "runway"],
    },

    negative_prompt: {
      type: "string",
      description:
        "A negative prompt listing unwanted defects, inconsistencies, and generation mistakes.",
    },

    editing_recipe: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "Step-by-step instructions for editing and assembling the final video.",
    },

    continuity_rules: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "Rules for keeping subjects, clothing, scenery, lighting, and camera direction consistent.",
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
    "continuity_rules",
  ],
} as const;
