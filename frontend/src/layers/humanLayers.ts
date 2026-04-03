import { ArcLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { CollisionFilterExtension } from "@deck.gl/extensions";
import type { CollisionFilterExtensionProps } from "@deck.gl/extensions";
import type { Enriched } from "../entities/HumanVisual";
import type { Human } from "../entities/Human";

type HumanEnriched = Enriched<Human>;

type HumanLayerParams = {
  processedHumans: HumanEnriched[];
  selectedLayerType: "arc" | "text" | "circle";
  zoom: number;
  fontSize: number;
  sizeMinPixels: number;
  sizeMaxPixels: number;
};

export function createHumanLayers({
  processedHumans,
  selectedLayerType,
  zoom,
  fontSize,
  sizeMinPixels,
  sizeMaxPixels
}: HumanLayerParams) {
  const layers = [];
  const SCATTER_FACTOR = 0.04 * 111320;

  if (selectedLayerType === "arc") {

    layers.push(
      new ArcLayer<HumanEnriched>({
        id: "humans-arc-layer",
        data: processedHumans,
        getSourcePosition: d => [d.lon, d.lat],
        getTargetPosition: d => [d.lonOffsetTarget, d.latOffsetTarget],
        getSourceColor: d => d.fillColor,
        getTargetColor: d => d.fillTColor,
        getWidth: 5,
        pickable: true
      })
    );

  }

  if (selectedLayerType === "text" || selectedLayerType === "circle") {

    layers.push(
      new ScatterplotLayer<HumanEnriched>({
        id: "ScatterplotLayer-for-lines",
        data: processedHumans,
        stroked: true,
        getPosition: d => [d.lon, d.lat],
        getRadius: d => (SCATTER_FACTOR / Math.log2(zoom)) * d.age,
        getFillColor: [0, 0, 0, 0],
        getLineColor: d => d.fillColor,
        lineWidthMinPixels: 0.5,
        pickable: true,
        radiusUnits: "meters"
      })
    );

    
  }

  if (selectedLayerType === "text") {

    layers.push(
      new TextLayer<HumanEnriched, CollisionFilterExtensionProps<HumanEnriched>>({
        id: "humans-text-layer",
        data: processedHumans,
        characterSet: "auto",
        fontSettings: { buffer: 8, sdf: true },
        getText: d => (d.awarded ? "✨" : " ") + d.name + "  (" + d.num_of_identifiers + ")",
        getPosition: d => [d.lonOffsetSource, d.latOffsetSource],
        getSize: d => Math.pow((d.num_of_identifiers + 10) * 30 * d.age, 0.25) / 40,
        sizeScale: fontSize,
        sizeMinPixels,
        sizeMaxPixels,
        maxWidth: 64 * 12,
        background: true,
        getBackgroundColor: d => d.fillColor,
        pickable: true,
        collisionEnabled: true,
        getCollisionPriority: d => Math.log2(d.num_of_identifiers + 20),
        collisionTestProps: {
          sizeScale: fontSize * 2,
          sizeMaxPixels: sizeMaxPixels * 2,
          sizeMinPixels: sizeMinPixels * 2
        },
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        extensions: [new CollisionFilterExtension()]
      })
    );
    
  }

  return layers;
}