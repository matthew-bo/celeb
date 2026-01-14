/**
 * Photo Features API
 * 
 * Comprehensive facial analysis for costume matching:
 * - Face shape, skin tone, features
 * - Hair analysis (length, color, style)
 * - Celebrity lookalike matching
 * - Overall vibe/aesthetic
 * 
 * Photo is processed and immediately discarded - not stored.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PhotoCuesSchema, type PhotoCues } from "@/lib/schema";

// Lazy initialization
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Default response when analysis fails
const DEFAULT_PHOTO_CUES: PhotoCues = {
  glassesLikely: false,
  facialHairLikely: false,
  hairLength: "unknown",
  hairColor: "unknown",
  faceShape: "unknown",
  skinTone: "unknown",
  ageRange: "unknown",
};

export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No photo provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    // Limit file size (10MB for higher quality analysis)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Call OpenAI Vision API
    const openai = getOpenAI();
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout for detailed analysis

    try {
      const response = await openai.chat.completions.create(
        {
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an expert facial analyst helping match people to costume ideas. Analyze the photo comprehensively and return a detailed JSON analysis.

Your analysis should include:

1. **Basic Features:**
   - glassesLikely: boolean - Are they wearing glasses?
   - facialHairLikely: boolean - Do they have facial hair?
   - hairLength: "short" | "medium" | "long" | "unknown"
   - hairColor: "black" | "brown" | "blonde" | "red" | "gray" | "white" | "other" | "unknown"
   - hairStyle: string (e.g., "curly", "straight", "wavy", "bald", "buzz cut", "afro")

2. **Face Analysis:**
   - faceShape: "oval" | "round" | "square" | "heart" | "oblong" | "diamond" | "rectangle" | "unknown"
   - skinTone: "very_light" | "light" | "medium" | "olive" | "tan" | "brown" | "dark" | "unknown"
   - features: array of notable features (e.g., ["strong jawline", "high cheekbones", "full lips", "piercing eyes"])

3. **Demographics:**
   - ageRange: "teen" | "20s" | "30s" | "40s" | "50s" | "60plus" | "unknown"
   - build: "slim" | "athletic" | "average" | "muscular" | "large" | "unknown" (if visible)

4. **Celebrity Matches (IMPORTANT!):**
   - celebrityMatches: array of 3-5 celebrities they resemble, each with:
     - name: Celebrity's full name
     - confidence: "high" | "medium" | "low"
     - notes: Brief explanation of the resemblance
   Think broadly: actors, musicians, athletes, influencers, historical figures, fictional character actors.
   Consider bone structure, facial features, overall vibe, not just superficial similarity.

5. **Vibe/Aesthetic:**
   - vibeKeywords: array of 3-5 aesthetic descriptors (e.g., ["classic", "edgy", "approachable", "mysterious", "warm"])

Return ONLY valid JSON matching this exact structure. Be specific and confident in your assessments.
If you can't determine something, use "unknown" rather than guessing incorrectly.

Example response:
{
  "glassesLikely": false,
  "facialHairLikely": true,
  "hairLength": "short",
  "hairColor": "brown",
  "hairStyle": "wavy",
  "faceShape": "square",
  "skinTone": "medium",
  "features": ["strong jawline", "deep-set eyes", "prominent brow"],
  "ageRange": "30s",
  "build": "athletic",
  "celebrityMatches": [
    {"name": "Chris Evans", "confidence": "high", "notes": "Similar jawline and overall build"},
    {"name": "Henry Cavill", "confidence": "medium", "notes": "Similar bone structure"},
    {"name": "Oscar Isaac", "confidence": "medium", "notes": "Similar coloring and vibe"}
  ],
  "vibeKeywords": ["classic", "heroic", "approachable", "confident"]
}`
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: dataUrl,
                    detail: "high", // Use high detail for comprehensive analysis
                  },
                },
                {
                  type: "text",
                  text: "Analyze this person's face comprehensively for costume matching. Include celebrity lookalikes, face shape, skin tone, features, and overall vibe. Be specific and confident."
                }
              ],
            },
          ],
          max_tokens: 1000, // More tokens for detailed response
          temperature: 0.3, // Slightly higher for creative celebrity matching
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from vision API");
      }

      // Parse and validate
      const parsed = JSON.parse(content);
      const validated = PhotoCuesSchema.parse(parsed);

      return NextResponse.json(validated);

    } catch (error) {
      clearTimeout(timeout);
      
      // Handle timeout or abort
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Photo analysis timed out");
        return NextResponse.json(DEFAULT_PHOTO_CUES);
      }
      
      // Log the specific error for debugging
      console.error("Vision API error:", error);
      throw error;
    }

  } catch (error) {
    console.error("Photo features extraction error:", error);
    
    // Return safe defaults on any error - don't break the flow
    return NextResponse.json(DEFAULT_PHOTO_CUES);
  }
}

