import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AnalysisResponseSchema } from "../validations/analysisResponseSchema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


export type StructuredGigResponse = z.infer<typeof AnalysisResponseSchema>;

interface ParseAudioOptions {
  filePath: string;
  rawTitle?: string;
  existingSkills: Array<{ id: string; name: string }>;
}

/**
 * Uploads an MP3 file to Gemini, processes it with a native Gemini structural schema, and parses the response.
 */
export const parseAudioWithGemini = async ({
  filePath,
  rawTitle = "",
  existingSkills
}: ParseAudioOptions): Promise<StructuredGigResponse> => {
  let uploadResult: any;
  
  try {
    // 1. Upload the local MP3 file to Gemini's temporary media cloud storage
    uploadResult = await ai.files.upload({
      file: filePath,
      config: {
        mimeType: "audio/mp3",
      }
    });

    if (!uploadResult || !uploadResult.uri) {
      throw new Error("Failed to capture valid file reference URI from Gemini upload wrapper.");
    }

    // 2. Pass instructions along with the audio file chunk explicitly using raw Type definitions
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: uploadResult.uri,
                mimeType: uploadResult.mimeType || "audio/mp3"
              }
            },
            {
              text: `Analyze this audio presentation alongside the working project title: "${rawTitle}".
         
                     You are given our platform's master structural Skill Tree from the database below:
                     ${JSON.stringify(existingSkills)}
                     
                     INSTRUCTIONS FOR SKILL SELECTION:
                     1. Map skills required for this job into a hierarchical format: Parent Category (Tier 1) -> Sub-Skill (Tier 2) -> Leaf Skill (Tier 3).
                     2. If a skill explicitly or implicitly required for the job EXISTS in our database tree, place it in the 'matchedSkills' array, making sure to include its accurate 'id' from the database. Preserve its original nesting layout.
                     3. If a required technical skill DOES NOT exist anywhere in the provided database pool, DO NOT forge a fake ID. Instead, structuralize it cleanly inside the 'suggestedNewSkills' array following the exact same structural hierarchy (Parent -> Sub-skill -> Leaf). If it belongs under an existing parent category, use that category name to anchor it.

                     Extract an optimized professional job title, an itemized milestone scope breakdown for the description, and complete the 'matchedSkills' and 'suggestedNewSkills' structural arrays.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        // Using Type Schemas explicitly prevents the "def" parsing error completely
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: {
              type: "STRING",
              description: "A professional, high-converting job post title based on the context."
            },
            description: {
              type: "STRING",
              description: "An itemized, highly thorough description detailing scope items and deliverables parsed from the audio transcript text."
            },
            matchedSkills: {
              type: "ARRAY",
              description: "Hierarchical tree of skills that already EXIST in the provided database context.",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING", description: "The exact UUID from the database if it exists." },
                  name: { type: "STRING" },
                  tier: { type: "INTEGER" },
                  subSkills: { type: "ARRAY", items: { type: "OBJECT" }, description: "Nested sub-skills under this parent item." }
                },
                required: ["name", "tier"]
              }
            },
            suggestedNewSkills: {
              type: "ARRAY",
              description: "Hierarchical tree of newly proposed skills mentioned in the video that DO NOT exist in the provided database pool.",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  tier: { type: "INTEGER" },
                  subSkills: { type: "ARRAY", items: { type: "OBJECT" }, description: "Nested proposed sub-skills." }
                },
                required: ["name", "tier"]
              }
            }
          },
          required: ["title", "description", "matchedSkills", "suggestedNewSkills"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty text generation framework.");
    }

    // 3. Parse and return the structured JSON object wrapper matching schema definitions
    return JSON.parse(response.text) as StructuredGigResponse;

  } finally {
    if (uploadResult?.name) {
      await ai.files.delete({ name: uploadResult.name }).catch((err) => 
        console.error("Failed to delete temporary Gemini asset file:", err)
      );
    }
  }
};