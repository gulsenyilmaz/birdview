import { ArcLayer } from "@deck.gl/layers";
import type { ArcLayerProps } from "@deck.gl/layers";

import type {
  DefaultProps
} from "@deck.gl/core";

import type {
  ShaderModule
} from "@luma.gl/shadertools";


type AnimationUniforms = {
  progress: number;
  trailLength: number;
};


const uniformBlock = `
uniform humanMovementUniforms {
  float progress;
  float trailLength;
} humanMovement;
`;


const humanMovementUniforms = {
  name: "humanMovement",

  vs: uniformBlock,
  fs: uniformBlock,

  uniformTypes: {
    progress: "f32",
    trailLength: "f32"
  }
} as const satisfies ShaderModule<AnimationUniforms>;


type AnimatedArcExtraProps = {
  progress?: number;
  trailLength?: number;
};


export type AnimatedArcLayerProps<DataT = unknown> =
  ArcLayerProps<DataT> &
  AnimatedArcExtraProps;


const defaultProps: DefaultProps<AnimatedArcExtraProps> = {
  progress: {
    type: "number",
    value: 1,
    min: 0,
    max: 1
  },

  trailLength: {
    type: "number",
    value: 0.25,
    min: 0,
    max: 1
  }
};


export default class AnimatedArcLayer<
  DataT = unknown
> extends ArcLayer<
  DataT,
  Required<AnimatedArcExtraProps>
> {

  static layerName = "AnimatedArcLayer";

  static defaultProps = {
    ...ArcLayer.defaultProps,
    ...defaultProps
  };


  getShaders() {

    const shaders = super.getShaders();


    shaders.inject = {
      ...shaders.inject,

      "vs:#decl": `
        out float humanMovementProgress;
      `,

      "vs:#main-end": `
        humanMovementProgress = segmentRatio;
      `,

      "fs:#decl": `
        in float humanMovementProgress;
      `,

      "fs:#main-start": `
        float trailStart =
          max(
            0.0,
            humanMovement.progress -
            humanMovement.trailLength
          );

        if (
          humanMovementProgress > humanMovement.progress ||
          humanMovementProgress < trailStart
        ) {
          discard;
        }
      `,

      "fs:DECKGL_FILTER_COLOR": `
        float trailStart =
          max(
            0.0,
            humanMovement.progress -
            humanMovement.trailLength
          );

        float fade =
          smoothstep(
            trailStart,
            humanMovement.progress,
            humanMovementProgress
          );

        color.a *= fade;
      `
    };


    shaders.modules = [
      ...shaders.modules,
      humanMovementUniforms
    ];


    return shaders;
  }


  draw(params: any) {

    const {
      progress,
      trailLength
    } = this.props;


    const model = this.state.model;


    if (model) {
      model.shaderInputs.setProps({
        humanMovement: {
          progress,
          trailLength
        }
      });
    }


    super.draw(params);
  }
}