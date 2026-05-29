import { Request, Response } from "express";
import { uploadOnCloudinary } from "../config/cloudinary"; 
import { parseAudioWithGroq,parseProjectVideoWithGroq } from "../services/groq.service"; 
import fs from "fs";
import path from "path";
import axios from "axios";
import prisma from "../config/prisma"; 

const downloadFile = async (url: string, downloadPath: string): Promise<void> => {
  const writer = fs.createWriteStream(downloadPath);
  const response = await axios({ url, method: "GET", responseType: "stream" });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

export const analyzeUserProjectVideo = async (req: Request, res: Response) => {
  const localVideoPath = req.file?.path;
  const rawTitle = req.body.title || "";

  if (!localVideoPath) {
    return res.status(400).json({ 
      success: false, 
      message: "Validation Error: Project explainer video file is required." 
    });
  }

  let temporaryAudioPath = "";

  try {
    const skillTreeHierarchy = await prisma.skill.findMany({
      where: { parentId: null, tier: 1 }, 
      select: {
        id: true,
        name: true,
        tier: true,
        subSkills: {
          select: {
            id: true,
            name: true,
            tier: true,
            subSkills: {
              select: { 
                id: true, 
                name: true, 
                tier: true,
                subSkills: {
                  select: { id: true, name: true, tier: true } 
                }
              } 
            }
          }
        }
      }
    });

    const cloudinaryResponse = await uploadOnCloudinary(localVideoPath);
    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
      return res.status(500).json({ 
        success: false, 
        message: "Cloudinary upload failed or returned an empty response." 
      });
    }
    
    const videoUrl = cloudinaryResponse.secure_url;
    
    const audioUrl = videoUrl.replace(/\.[^/.]+(?=\?|$)/, ".mp3");

    const timestamp = Date.now();
    temporaryAudioPath = path.join("./public/temp", `project-audio-extract-${timestamp}.mp3`);
    await downloadFile(audioUrl, temporaryAudioPath);

    const structuredProjectProfile = await parseProjectVideoWithGroq({
      filePath: temporaryAudioPath,
      rawTitle,
      existingSkills: skillTreeHierarchy 
      
    });
    console.log("Structured Project Profile from Groq:", structuredProjectProfile);
    // 5. Send data back to front-end to auto-populate the user's portfolio form/profile
    return res.status(200).json({
      success: true,
      message: "User project video parsed successfully. Skills mapped to taxonomy.",
      data: {
        ...structuredProjectProfile,
        videoUrl 
      }
    });

  } catch (error: any) {
    console.error("Project Evaluation Pipeline failure:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An internal server error occurred while analyzing your project with AI.",
      error: error?.message || error
    });
  } finally {
    // 6. Cleanup temporary file safely to preserve system storage space
    if (temporaryAudioPath && fs.existsSync(temporaryAudioPath)) {
      fs.unlinkSync(temporaryAudioPath);
    }
  }
};

export const analyzeVideo = async (req: Request, res: Response) => {
  const localVideoPath = req.file?.path;
  const rawTitle = req.body.title || "";

  if (!localVideoPath) {
    return res.status(400).json({ 
      success: false, 
      message: "Validation Error: Explainer video brief file is required." 
    });
  }

  let temporaryAudioPath = "";

  try {
    const skillTreeHierarchy = await prisma.skill.findMany({
      where: { parentId: null, tier: 1 }, 
      select: {
        id: true,
        name: true,
        tier: true,
        subSkills: {
          select: {
            id: true,
            name: true,
            tier: true,
            subSkills: {
              select: { 
                id: true, 
                name: true, 
                tier: true,
                subSkills: {
                  select: { id: true, name: true, tier: true } 
                }
              } 
            }
          }
        }
      }
    });

    const cloudinaryResponse = await uploadOnCloudinary(localVideoPath);
    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
      return res.status(500).json({ 
        success: false, 
        message: "Cloudinary upload failed or returned an empty response." 
      });
    }
    
    const videoUrl = cloudinaryResponse.secure_url;
    const audioUrl = videoUrl.replace(/\.[^/.]+(?=\?|$)/, ".mp3");

    const timestamp = Date.now();
    temporaryAudioPath = path.join("./public/temp", `audio-extract-${timestamp}.mp3`);
    await downloadFile(audioUrl, temporaryAudioPath);

    const structuredOutput = await parseAudioWithGroq({
      filePath: temporaryAudioPath,
      rawTitle,
      existingSkills: skillTreeHierarchy 
    });

    return res.status(200).json({
      success: true,
      message: "Video parsed successfully with distinct hierarchy separations via Groq.",
      data: {
        ...structuredOutput,
        videoUrl 
      }
    });

  } catch (error: any) {
    console.error("Pipeline failure:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An internal server error occurred while processing your video with AI.",
      error: error?.message || error
    });
  } finally {
    if (temporaryAudioPath && fs.existsSync(temporaryAudioPath)) {
      fs.unlinkSync(temporaryAudioPath);
    }
  }
};