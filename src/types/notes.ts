export type Point = { x: number; y: number };

export type Stroke = {
  id: string;
  color: string;
  width: number;
  points: Point[];
  tool: "pen" | "eraser";
};

export type DrawingData = {
  strokes: Stroke[];
};

export type Note = {
  id: string;
  title: string;
  content: string;
  drawing: DrawingData;
  updatedAt: number;
};
