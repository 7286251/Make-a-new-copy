
import { GoogleGenAI } from "@google/genai";
import { VideoDuration } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string usable by Gemini.
 */
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generates the ad script based on image, reference (script or video), and duration.
 */
export const generateScript = async (
  imageFile: File,
  referenceScript: string,
  duration: VideoDuration,
  referenceVideo?: File | null
): Promise<string> => {
  try {
    const base64Image = await fileToGenerativePart(imageFile);
    
    // Prepare parts array
    let parts: any[] = [
      { inlineData: { mimeType: imageFile.type, data: base64Image } }
    ];

    // Base prompt setup
    let prompt = `
      你是一位世界级的电商视频广告编剧大师和Sora视频提示词专家。
      
      **任务目标：**
      请根据我提供的【产品图片】`;

    // Conditional Logic: Video vs Script Reference
    if (referenceVideo) {
      if (referenceVideo.size > 20 * 1024 * 1024) {
        throw new Error("参考视频过大，请上传小于 20MB 的视频文件。");
      }
      const base64Video = await fileToGenerativePart(referenceVideo);
      parts.push({ inlineData: { mimeType: referenceVideo.type, data: base64Video } });
      
      prompt += `和【参考视频】，创作一个新的视频拍摄脚本/提示词。
      
      **核心要求（必须严格遵守）：**
      1.  **视频复刻：** 请深入分析【参考视频】的运镜手法、剪辑节奏、场景氛围和光影效果。保持参考视频 90% 的风格一致性，但必须将视频中的【原始主体物品】完美替换为我的【产品图片】中的商品。
      `;
    } else {
      prompt += `和【参考脚本】，创作一个新的视频拍摄脚本/提示词。
      
      **核心要求（必须严格遵守）：**
      1.  **复刻程度：** 新脚本必须保持参考脚本 90% 的一致性。这意味着镜头语言、运镜方式、光影氛围、剪辑节奏、背景音乐风格必须与参考脚本高度相似，仅仅将参考脚本中的核心物体完美替换为图片中的【我的产品】。
      **参考脚本内容：**
      ${referenceScript}
      `;
    }

    // Common instructions
    prompt += `
      2.  **时长适配：** 请严格按照我要求的时长【${duration}】来规划镜头数量和节奏。
      3.  **格式要求：** 输出格式必须严格遵循以下Markdown结构，不要包含Markdown代码块标记（如 \`\`\`markdown），直接输出内容：

      ---
      **总体分析**
      *   **核心主题：** ...
      *   **角色：** ...
      *   **场景：** ...
      *   **物品：** [基于图片详细描述产品外观]
      *   **一致性：** ...
      *   **画面风格/氛围/色调/光影/情绪：** ...
      *   **背景音乐：** ...

      ---
      **镜头分析**
      [请根据 ${duration} 的时长拆分时间轴，例如 00:00-00:02]

      **00:00-00:XX**
      *   **画面风格/氛围/色调/光影/情绪：** ...
      *   **故事内容细节：** [详细描述画面，将主体替换为我的产品，保留原参考内容的动作和运镜]
      *   **台词对话：** ...
      *   **音效信息：** ...
      *   **人物外貌特征/行为动作/表情：** ...
      *   **镜头语言：** ...

      (依次类推...)
      ---
      **背景音乐分析**
      ...
    `;

    // Add prompt text to parts
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts
      },
      config: {
        temperature: 0.7, 
      }
    });

    return response.text || "生成脚本失败，请重试。";
  } catch (error: any) {
    console.error("Error generating script:", error);
    throw new Error(error.message || "API请求失败，请检查网络或图片/视频格式。");
  }
};

/**
 * Polishes the existing script.
 */
export const polishScript = async (currentScript: string): Promise<string> => {
  try {
    const prompt = `
      你是一位资深的电商营销文案专家。请对下面的视频脚本进行【润色】。
      
      **润色要求：**
      1. **痛点直击：** 让台词更具穿透力，更能直击消费者痛点。
      2. **画面感：** 优化"故事内容细节"的描述，使其更适合AI视频生成模型（如Sora）理解，增加细节描述词（材质、光泽、动态）。
      3. **转化率：** 在结尾部分增强号召力（Call to Action）。
      4. **保持结构：** 保持原有的Markdown结构不变，只修改内容。

      **待润色脚本：**
      ${currentScript}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "润色失败，请重试。";
  } catch (error) {
    console.error("Error polishing script:", error);
    throw new Error("润色请求失败。");
  }
};
