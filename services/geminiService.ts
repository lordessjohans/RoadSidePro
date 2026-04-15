
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { RepairMessage, ImageGenConfig, VideoGenConfig } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const searchGroundingAssistant = async (prompt: string): Promise<GenerateContentResponse> => {
  const ai = getAIClient();
  return await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are an expert automotive and bicycle mechanic assistant. Provide accurate troubleshooting steps for vehicle and bike problems. If the query is about specific parts or news, use Google Search to provide up-to-date information. Always cite your sources.",
    },
  });
};

export const getDailyDeals = async (): Promise<GenerateContentResponse> => {
  const ai = getAIClient();
  const today = new Date().toLocaleDateString();
  return await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find the 5 best current online deals, discounts, or trending accessories for automotive repair and bicycle maintenance for ${today}. Focus on items like portable tire inflators, jump starters, multi-tools, or high-quality lubricants. Provide names, a brief reason why it's a good deal, and the URL.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are a smart shopping assistant for motorists and cyclists. Your goal is to find the best value-for-money repair parts and accessories available today. Always include source URLs from grounding metadata.",
    },
  });
};

export const mapsGroundingAssistant = async (prompt: string, location?: { latitude: number, longitude: number }): Promise<GenerateContentResponse> => {
  const ai = getAIClient();
  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: location
      }
    };
  }

  return await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config,
  });
};

export const diagnoseAssistant = async (prompt: string, image?: { data: string, mimeType: string }): Promise<GenerateContentResponse> => {
  const ai = getAIClient();
  const parts: any[] = [{ text: prompt }];

  if (image) {
    parts.unshift({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    });
  }

  return await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      thinkingConfig: { thinkingBudget: 4000 },
      systemInstruction: `You are a Master Automotive & Bicycle Diagnostic Technician. 
      Analyze symptoms, sounds, smells, error codes, or visual dashboard indicators.
      If an image is provided, identify warning lights (Check Engine, ABS, etc.) or text from scanner screens.
      Provide a structured diagnostic report including:
      1. Potential Primary Cause.
      2. Severity Level (Safe to Drive / Urgent / Immediate Stop).
      3. Estimated Diagnostic Difficulty (1-10).
      4. Step-by-step troubleshooting or temporary roadside fixes.
      
      CRITICAL: If the issue is severe (Severity Urgent or Immediate Stop) or the user seems overwhelmed, RECOMMEND that they use the 'Request On-Site Tech' dispatch feature in the app to have a physical repairman come to their location immediately.
      
      Safety is the number one priority.`,
    },
  });
};

export const generateVehicleImage = async (
  prompt: string, 
  config: ImageGenConfig, 
  referenceImage?: { data: string, mimeType: string }
): Promise<string> => {
  const ai = getAIClient();
  
  const parts: any[] = [{ text: prompt }];
  
  if (referenceImage) {
    parts.unshift({
      inlineData: {
        data: referenceImage.data,
        mimeType: referenceImage.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: parts,
    },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
        imageSize: config.size
      }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data generated");
};

export const generateVehicleVideo = async (
  prompt: string, 
  base64Image: string, 
  config: VideoGenConfig,
  onProgress: (msg: string) => void
): Promise<string> => {
  const ai = getAIClient();
  onProgress("Initializing video generation operation...");
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: {
      imageBytes: base64Image.split(',')[1],
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: config.aspectRatio
    }
  });

  onProgress("Rendering your cinematic vehicle sequence. This usually takes a few minutes...");
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
    onProgress("Still working on it... refining the motion and lighting.");
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");
  
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
