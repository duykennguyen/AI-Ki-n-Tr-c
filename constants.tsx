
import React from 'react';

export const ARCHITECTURAL_STYLES = [
  {
    id: 'modern',
    name: 'Modern Minimalism',
    prompt: 'Architectural masterpiece, modern minimalism, raw concrete and floor-to-ceiling glass, floating volumes, seamless indoor-outdoor transition, cantilevered roofs, soft indirect lighting, high-end architectural photography, cinematic mood.',
    description: 'Sự giao thoa giữa những khối hình kỷ hà và vật liệu thô mộc, tối ưu hóa ánh sáng tự nhiên.'
  },
  {
    id: 'tropical',
    name: 'Biophilic Tropical',
    prompt: 'Luxury tropical architecture, organic materials, integration with dense lush vegetation, wooden louvers, natural slate stone, water features reflecting the structure, warm ambient light, high-end resort aesthetic.',
    description: 'Kiến trúc xanh bền vững, kết nối con người với thiên nhiên thông qua vật liệu hữu cơ.'
  },
  {
    id: 'industrial',
    name: 'Refined Industrial',
    prompt: 'Sophisticated industrial loft architecture, darkened steel, reclaimed brick, double-height ceilings, architectural structural honesty, monochromatic palette with metallic accents, mood lighting.',
    description: 'Vẻ đẹp của sự chân thực trong cấu trúc, kết hợp giữa kim loại lạnh và ánh sáng ấm áp.'
  },
  {
    id: 'neoclassical',
    name: 'Contemporary Classic',
    prompt: 'Modern neoclassical interpretation, refined symmetry, clean classical orders, subtle ornamentation, light travertine stone, majestic yet restrained, timeless elegance, soft diffuse daylight.',
    description: 'Sự kế thừa các giá trị vĩnh cửu của cổ điển trong một hình hài đương đại, tiết chế và sang trọng.'
  }
];

export const FLOORPLAN_VARIANTS = [
  { id: 'v1', name: 'Open Flow', description: 'Giải phóng không gian, tạo sự kết nối liền mạch giữa các khu vực chức năng.' },
  { id: 'v2', name: 'Privacy Core', description: 'Tối ưu hóa các trục giao thông để đảm bảo sự riêng tư tuyệt đối cho từng thành viên.' },
  { id: 'v3', name: 'Zen Atrium', description: 'Thiết kế xoay quanh lõi xanh trung tâm, đưa sinh khí vào mọi ngóc ngách của ngôi nhà.' },
  { id: 'v4', name: 'Flexible Module', description: 'Cấu trúc không gian tùy biến, sẵn sàng cho những thay đổi trong nhu cầu sử dụng dài hạn.' }
];

export const RENOVATION_STYLES = [
  {
    id: 'renov-modern',
    name: 'Modern Refresh',
    prompt: 'Full exterior renovation, preserving existing structure, replacing old windows with large black aluminum frames, clean white stucco walls, adding wooden slats accents, modern landscaping, architectural night lighting.',
    description: 'Hiện đại hóa diện mạo bằng vật liệu đương đại, giữ nguyên hệ khung kết cấu cũ.'
  },
  {
    id: 'renov-luxury',
    name: 'Luxury Facelift',
    prompt: 'High-end architectural transformation, preserving core volume, applying marble and stone cladding, sophisticated exterior lighting design, premium glass systems, luxury landscape design, photorealistic.',
    description: 'Nâng cấp sang trọng với vật liệu đá tự nhiên và hệ thống chiếu sáng nghệ thuật.'
  },
  {
    id: 'renov-biophilic',
    name: 'Nature Integration',
    prompt: 'Biophilic renovation, adding vertical gardens to existing walls, wooden trellises, natural earth tones, large openings for ventilation, organic integration with surroundings.',
    description: 'Tái cấu trúc thẩm mỹ theo hướng bền vững, đưa thiên nhiên len lỏi vào công trình.'
  },
  {
    id: 'renov-minimal',
    name: 'Zen Transformation',
    prompt: 'Minimalist renovation, stripping away unnecessary ornaments, focusing on pure geometry, muted color palette, high-quality finishes, serene atmosphere, master architect style.',
    description: 'Loại bỏ các chi tiết rườm rà, tập trung vào vẻ đẹp của sự giản đơn và tinh tế.'
  }
];

export const LAND_PLANNING_STYLES = [
  {
    id: 'land-family',
    name: 'Family Residence',
    prompt: 'Architectural floor plan for a multi-generational family home, efficient room distribution, clear zoning for public and private areas, technical architectural symbols, high-contrast 2D top-down view.',
    description: 'Bố cục mặt bằng tối ưu cho gia đình nhiều thế hệ, phân khu chức năng rõ rệt.'
  },
  {
    id: 'land-studio',
    name: 'Compact Studio',
    prompt: 'Smart living floor plan, open studio layout, multi-functional furniture zones, space-saving architectural solutions, 2D blueprint style, professional architectural drafting.',
    description: 'Giải pháp không gian thông minh cho căn hộ nhỏ, tối đa hóa diện tích sử dụng.'
  },
  {
    id: 'land-villa',
    name: 'Luxury Villa Layout',
    prompt: 'Grand luxury villa floor plan, symmetrical or organic flow, large entertainment areas, swimming pool and landscape integration, detailed interior layout markers, 2D architectural masterplan.',
    description: 'Quy hoạch mặt bằng biệt thự cao cấp với các không gian giải trí và sân vườn tích hợp.'
  },
  {
    id: 'land-commercial',
    name: 'Boutique Office/Shop',
    prompt: 'Commercial architectural floor plan, customer flow optimization, open workspace, service core placement, technical floor markers, professional 2D presentation.',
    description: 'Thiết kế mặt bằng kinh doanh/văn phòng, tối ưu hóa luồng giao thông khách hàng.'
  }
];
