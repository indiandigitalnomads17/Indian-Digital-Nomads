import Groq from "groq-sdk";
import fs from "fs";

// Initialize the Groq SDK client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface ParseAudioOptions {
  filePath: string;
  rawTitle?: string;
  existingSkills: any[];
}

/**
 * Uses Groq's high-speed API models to transcribe and extract deeply analyzed,
 * structured job parameters matching your multi-tier database hierarchy.
 */
export const parseAudioWithGroq = async ({
  filePath,
  rawTitle = "",
  existingSkills
}: ParseAudioOptions) => {
  
  try {
    // Stage 1: Transcribe the MP3 file using Groq's Whisper pipeline
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
    });

    if (!transcription.text) {
      throw new Error("Groq Whisper engine failed to return a valid transcript.");
    }

    // Stage 2: Structuralize the text with Llama 3.3 using strict JSON Mode
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert technical systems estimator. Your task is to perform an exhaustive semantic analysis on raw voice transcripts, align them perfectly with an existing system taxonomy, and output a structured JSON string.
          
          You MUST structure your JSON output according to this precise schema:
          {
            "title": "string (A professional, high-converting job post title)",
            "description": "string (A single comprehensive, professionally formatted project brief detailing every single item, constraint, milestone, and requirement covered in the transcript. Use clean paragraph breaks or bullet points explicitly typed as strings. DO NOT return an array of strings.)",
            "matchedSkills": [
              { "id": "string", "name": "string", "tier": 1, "subSkills": [
                { "id": "string", "name": "string", "tier": 2, "subSkills": [
                  { "id": "string", "name": "string", "tier": 3 }
                ]}
              ]}
            ],
            "suggestedNewSkills": [
              { "name": "string", "tier": 1, "subSkills": [] }
            ]
          }

          CRITICAL SKILLS ANALYSIS & MATCHING INSTRUCTIONS:
          1. RIGOROUS SKILL MATCHING: Evaluate the transcript context dynamically. Your absolute priority is to match the technical needs of the job to the existing database skills provided below. Look for aliases, tools, or foundational languages that heavily map into these existing structures.
          2. MAINTAIN ALL ANCESTOR PATHS: If a Leaf Skill (Tier 3, like 'React') matches, you MUST also include its specific Sub-Skill (Tier 2, like 'Frontend Development') and its Parent Category (Tier 1, like 'Web Development') nesting them cleanly into each other as shown in the schema.
          3. Base all 'matchedSkills' selections on this exact database tree pool:
             ${JSON.stringify(existingSkills)}
          4. For 'matchedSkills', you must use the exact 'id' and 'name' provided in the database tree above. Ensure parents wrap their respective children.
          5. Only if a required skill is explicitly vital and completely missing from the tree above should you construct its hierarchy cleanly within the 'suggestedNewSkills' array.

          CRITICAL DESCRIPTION & SCOPING INSTRUCTIONS:
          1. BE EXHAUSTIVE: Do not summarize or cut out details. The 'description' string must be a thorough, multi-paragraph document capturing ALL technical requirements, tech stacks, workflow constraints, or timelines mentioned across the transcription text.
          2. SUITABLE FORMATTING: Ensure the scope reads logically with explicit line breaks (\\n) separating milestones or deliverables.

          CRITICAL SYSTEM HANDLING:
          - If the content cannot be fully parsed or contains no relevant tools, use clean empty fallbacks.
          - NEVER include conversational introductions, explanations, apologies, or markdown enclosures like \`\`\`json.`
        },
        {
          role: "user",
          content: `Tentative Project Title: "${rawTitle}". Audio Transcript Content: "${transcription.text}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const rawJsonString = chatCompletion.choices[0]?.message?.content;
    if (!rawJsonString) {
      throw new Error("Llama structural analysis engine returned an empty context body.");
    }

    return JSON.parse(rawJsonString);

  } catch (error) {
    console.error("Groq Processing Error:", error);
    throw error;
  }
};