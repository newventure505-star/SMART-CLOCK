import React, { useMemo, useRef } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { DrawingData, Point, Stroke } from "../types/notes";

const buildPath = (points: Point[]) => {
  if (points.length === 0) {
    return "";
  }
  return points.reduce(
    (path, point, index) =>
      index === 0
        ? `M ${point.x} ${point.y}`
        : `${path} L ${point.x} ${point.y}`,
    ""
  );
};

type DrawingCanvasProps = {
  drawing: DrawingData;
  mode: "draw" | "text";
  color: string;
  eraserColor: string;
  strokeWidth: number;
  tool: "pen" | "eraser";
  onChange: (drawing: DrawingData) => void;
  scale: number;
  translate: { x: number; y: number };
  canvasSize: { width: number; height: number };
  onCanvasLayout?: (width: number, height: number) => void;
};

export const DrawingCanvas = ({
  drawing,
  mode,
  color,
  eraserColor,
  strokeWidth,
  tool,
  onChange,
  scale,
  translate,
  canvasSize,
  onCanvasLayout,
}: DrawingCanvasProps) => {
  const activeStroke = useRef<Stroke | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => mode === "draw",
        onMoveShouldSetPanResponder: () => mode === "draw",
        onPanResponderGrant: (event) => {
          if (mode !== "draw") {
            return;
          }
          const { locationX, locationY } = event.nativeEvent;
          activeStroke.current = {
            id: `${Date.now()}`,
            color: tool === "eraser" ? eraserColor : color,
            width: strokeWidth,
            points: [{ x: locationX, y: locationY }],
            tool,
          };
        },
        onPanResponderMove: (event) => {
          if (!activeStroke.current || mode !== "draw") {
            return;
          }
          const { locationX, locationY } = event.nativeEvent;
          activeStroke.current.points.push({ x: locationX, y: locationY });
          const baseStrokes = drawing.strokes.filter(
            (stroke) => stroke.id !== activeStroke.current?.id
          );
          onChange({
            strokes: [...baseStrokes, { ...activeStroke.current }],
          });
        },
        onPanResponderRelease: () => {
          if (!activeStroke.current) {
            return;
          }
          const baseStrokes = drawing.strokes.filter(
            (stroke) => stroke.id !== activeStroke.current?.id
          );
          onChange({
            strokes: [...baseStrokes, { ...activeStroke.current }],
          });
          activeStroke.current = null;
        },
      }),
    [mode, color, eraserColor, strokeWidth, tool, onChange, drawing.strokes]
  );

  const paths = drawing.strokes.map((stroke) => (
    <Path
      key={stroke.id}
      d={buildPath(stroke.points)}
      stroke={stroke.color}
      strokeWidth={stroke.width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ));

  return (
    <View
      style={styles.canvas}
      onLayout={(event) => {
        if (!onCanvasLayout) {
          return;
        }
        const { width, height } = event.nativeEvent.layout;
        onCanvasLayout(width, height);
      }}
      {...panResponder.panHandlers}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${canvasSize.width || 1} ${canvasSize.height || 1}`}
        style={{ transform: [{ scale }, { translateX: translate.x }, { translateY: translate.y }] }}
      >
        <Rect x="0" y="0" width={canvasSize.width} height={canvasSize.height} fill="transparent" />
        {paths}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
