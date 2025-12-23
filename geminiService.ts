
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, DesignVariant, AppMode } from "./types";
import { ARCHITECTURAL_STYLES, FLOORPLAN_VARIANTS, RENOVATION_STYLES, LAND_PLANNING_STYLES } from "./constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Analyzes an image and returns architectural insights.
 */
export async function analyzeArchitecture(imageBuffer: string | null, mode: AppMode, textDescription: string): Promise<AnalysisResult> {
  let systemPrompt = "";
  
  if (mode === AppMode.SKETCH_TO_RENDER) {
    systemPrompt = "Bạn là một kiến trúc sư cao cấp. Hãy phân tích hình ảnh phác thảo này. Xác nhận các đặc điểm hình khối, đường nét và đề xuất hướng phát triển 3D. Trả về JSON.";
  } else if (mode === AppMode.PERSPECTIVE_TO_FLOORPLAN) {
    systemPrompt = "Bạn là một chuyên gia quy hoạch mặt bằng. Phân tích phối cảnh này để suy luận bố cục không gian bên trong (vị trí cửa, giao thông, các phòng). Trả về JSON.";
  } else if (mode === AppMode.LAND_TO_FLOORPLAN) {
    systemPrompt = "Bạn là chuyên gia quy hoạch kiến trúc. Phân tích mảnh đất dựa trên hình ảnh phác thảo (nếu có) và mô tả: " + textDescription + ". Xác định kích thước, hướng tiếp cận và giải pháp phân khu. Trả về JSON.";
  } else {
    systemPrompt = "Bạn là một chuyên gia cải tạo (Renovation Expert). Phân tích hiện trạng công trình này: đánh giá tình trạng vật liệu, cấu trúc chính và đề xuất cải tạo. Trả về JSON.";
  }

  const parts: any[] = [{ text: systemPrompt }];
  if (imageBuffer) {
    parts.unshift({ inlineData: { data: imageBuffer.split(',')[1], mimeType: 'image/png' } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          architectureStyle: { type: Type.STRING, description: 'Phong cách hiện tại hoặc đề xuất' },
          structureNotes: { type: Type.STRING, description: 'Ghi chú về kết cấu/đường nét' },
          recommendations: { type: Type.STRING, description: 'Đề xuất thiết kế' }
        },
        required: ['architectureStyle', 'structureNotes', 'recommendations']
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

/**
 * Generates an image variant based on the source and a specific style/variant description.
 */
export async function generateDesignVariant(
  sourceImage: string | null, 
  mode: AppMode, 
  styleOrVariant: any,
  userRequirement?: string
): Promise<string> {
  const requirementPart = userRequirement ? `YÊU CẦU CHI TIẾT TỪ NGƯỜI DÙNG (ƯU TIÊN CAO NHẤT): ${userRequirement}` : "";
  let prompt = "";

  if (mode === AppMode.SKETCH_TO_RENDER) {
    prompt = `Bạn là một chuyên gia diễn họa kiến trúc. Dựa trên phác thảo này, HOÀN THIỆN phối cảnh 3D. 
      GIỮ NGUYÊN 100% hình khối gốc. Hoàn thiện vật liệu, cửa, cây cối, ánh sáng theo phong cách ${styleOrVariant.name}: ${styleOrVariant.prompt}. 
      ${requirementPart} Ảnh 4K siêu thực.`;
  } else if (mode === AppMode.PERSPECTIVE_TO_FLOORPLAN) {
    prompt = `Vẽ bản vẽ mặt bằng 2D chuyên nghiệp từ phối cảnh này. Kiểu ${styleOrVariant.name}. Ký hiệu tường đậm, cửa nét mở, nội thất đầy đủ. 
      ${requirementPart} Bản vẽ kỹ thuật sạch sẽ.`;
  } else if (mode === AppMode.LAND_TO_FLOORPLAN) {
    prompt = `Bạn là chuyên gia thiết kế mặt bằng kiến trúc. ${sourceImage ? 'Dựa trên phác thảo mảnh đất này và mô tả' : 'Dựa trên mô tả chi tiết của khách hàng'}, hãy thiết kế một mặt bằng 2D chuyên nghiệp (Top-down view). 
      Phong cách quy hoạch: ${styleOrVariant.name} - ${styleOrVariant.prompt}. 
      Yêu cầu: Vẽ sơ đồ mặt bằng chi tiết, ký hiệu tường đậm, phân chia phòng khách, bếp, ngủ, vệ sinh hợp lý, có chú thích kích thước và ký hiệu cửa.
      ${requirementPart} Bản vẽ phải đạt chuẩn kỹ thuật kiến trúc, trình bày trên nền trắng hoặc blueprint chuyên nghiệp.`;
  } else {
    prompt = `Bạn là chuyên gia CẢI TẠO KIẾN TRÚC. Nhiệm vụ: Biến đổi diện mạo của công trình trong ảnh này.
      QUY TẮC BẮT BUỘC: Giữ nguyên hệ khung kết cấu chính.
      THỰC HIỆN: Thay đổi hoàn toàn vật liệu, hệ cửa, màu sơn và cảnh quan theo phong cách ${styleOrVariant.name}: ${styleOrVariant.prompt}.
      ${requirementPart} Kết quả phải là một công trình cũ đã được thay áo mới tinh tế.`;
  }

  const parts: any[] = [{ text: prompt }];
  if (sourceImage) {
    parts.unshift({ inlineData: { data: sourceImage.split(',')[1], mimeType: 'image/png' } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: (mode === AppMode.PERSPECTIVE_TO_FLOORPLAN || mode === AppMode.LAND_TO_FLOORPLAN) ? "1:1" : "16:9",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Không thể tạo hình ảnh.");
}
