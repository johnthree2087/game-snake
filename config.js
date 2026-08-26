export const TILE_SIZE = 40;
// export const GRID_WIDTH = 10;
// export const GRID_HEIGHT = 20;
export const SEGMENT_SIZE = TILE_SIZE - 4;
export const SEGMENT_RADIUS = 5;
export const FOOD_RADIUS = (TILE_SIZE - 4) / 2;

// 获取当前设备可用尺寸（兼容 SSR 或 Node 环境）
const getScreenSize = () => {
  if (typeof window !== 'undefined') {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return { width: 400, height: 800 }; // 默认兜底尺寸
};

const screenSize = getScreenSize();

// 动态计算网格数量，向下取整确保不超出屏幕
export const GRID_WIDTH = Math.floor(screenSize.width / TILE_SIZE);
export const GRID_HEIGHT = Math.floor(screenSize.height / TILE_SIZE);
