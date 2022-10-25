export function LineProgram(regl) {
  const segments = [
    [0, -0.5],
    [1, -0.5],
    [1, 0.5],
    [0, -0.5],
    [1, 0.5],
    [0, 0.5],
  ];

  return regl({
    vert: `
      precision highp float;
  
      uniform float width;
      uniform mat4 projection;
      uniform int scaleType;
      uniform float setFirst;
      uniform float setMin;
      uniform float setMax;
  
      attribute vec2 position;
      attribute float timeA;
      attribute float pointA;
      attribute float timeB;
      attribute float pointB;
  
      void main() {
        float pA = pointA;
        float pB = pointB;

        if (scaleType == 1) {
          pA = ((pointA - setFirst) / abs(setFirst)) * 100.0;
          pB = ((pointB - setFirst) / abs(setFirst)) * 100.0;
        }
        else if (scaleType == 2) {
          pA = (pointA - setMin) / (setMax - setMin) * 100.0;
          pB = (pointB - setMin) / (setMax - setMin) * 100.0;
        }

        vec2 xBasis = vec2(timeB, pB) - vec2(timeA, pA);
        vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
        vec2 point = vec2(timeA, pA) + xBasis * position.x + yBasis * width * position.y;
        gl_Position = projection * vec4(point, 0, 1);
      }`,

    frag: `
      precision highp float;
  
      uniform vec4 color;
      
      void main() {
        gl_FragColor = color;
      }`,

    attributes: {
      position: {
        buffer: regl.buffer(segments),
        divisor: 0,
      },
      timeA: {
        buffer: regl.prop("times"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0,
        stride: Float32Array.BYTES_PER_ELEMENT * 1,
      },
      pointA: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0,
        stride: Float32Array.BYTES_PER_ELEMENT * 1,
      },
      timeB: {
        buffer: regl.prop("times"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 1,
        stride: Float32Array.BYTES_PER_ELEMENT * 1,
      },
      pointB: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 1,
        stride: Float32Array.BYTES_PER_ELEMENT * 1,
      },
    },

    uniforms: {
      scaleType: regl.prop("scaleType"),
      setFirst: regl.prop("setFirst"),
      setMin: regl.prop("setMin"),
      setMax: regl.prop("setMax"),
      width: regl.prop("width"),
      color: regl.prop("color"),
      projection: regl.prop("projection"),
    },

    count: segments.length,

    instances: regl.prop("segments"),

    viewport: regl.prop("viewport"),
  });
}

export function BackgroundProgram(regl) {
  const points = [-1, 1, -1, -1, 1, 1, -1, -1, 1, -1, 1, 1];

  return regl({
    vert: `
      attribute vec2 point;

      void main() {
        gl_Position = vec4(point, 0, 1);
      }
    `,

    frag: `
      void main() {
        gl_FragColor = vec4(0.05, 0.05, 0.05, 1);
      }
    `,

    attributes: {
      point: points,
    },

    count: points.length / 2,
  });
}

export function CandleStickProgram(regl) {
  const segments = [
    [-0.05, 1],
    [-0.05, 0],
    [0.05, 1],
    [0.05, 1],
    [-0.05, 0],
    [0.05, 0],
  ];

  return regl({
    vert: `
      precision highp float;

      uniform float timeframe;
      uniform mat4 projection;

      attribute vec2 position;
      attribute float timestamp;
      attribute float high;
      attribute float low;

      void main() {
        vec4 offset = vec4(position.x * timeframe, position.y * (high - low), 0, 1);
        vec4 point = vec4(timestamp, low, 0, 0);

        gl_Position = projection * (point + offset);
      }
    `,

    frag: `
      precision highp float;

      uniform vec4 color;

      void main() {
        gl_FragColor = color;
      }
    `,

    attributes: {
      position: {
        buffer: regl.buffer(segments),
        divisor: 0,
      },
      timestamp: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0,
        stride: Float32Array.BYTES_PER_ELEMENT * 5,
      },
      high: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 2,
        stride: Float32Array.BYTES_PER_ELEMENT * 5,
      },
      low: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 3,
        stride: Float32Array.BYTES_PER_ELEMENT * 5,
      },
    },

    uniforms: {
      timeframe: regl.prop("timeframe"),
      color: regl.prop("color"),
      projection: regl.prop("projection"),
    },

    count: segments.length,

    instances: regl.prop("segments"),

    viewport: regl.prop("viewport"),
  });
}

export function CandleBodyProgram(regl) {
  const segments = [
    [-0.45, 1],
    [-0.45, 0],
    [0.45, 1],
    [0.45, 1],
    [-0.45, 0],
    [0.45, 0],
  ];

  return regl({
    vert: `
      precision highp float;

      uniform float timeframe;
      uniform mat4 projection;

      attribute vec2 position;
      attribute float timestamp;
      attribute float close;
      attribute float open;

      void main() {
        vec4 offset = vec4(position.x * timeframe, position.y * (close - open), 0, 1);
        vec4 point = vec4(timestamp, open, 0, 0);

        gl_Position = projection * (point + offset);
      }
    `,

    frag: `
      precision highp float;

      uniform vec4 color;

      void main() {
        gl_FragColor = color;
      }
    `,

    attributes: {
      position: {
        buffer: regl.buffer(segments),
        divisor: 0,
      },
      timestamp: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0,
        stride: Float32Array.BYTES_PER_ELEMENT * 5,
      },
      open: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 1,
        stride: Float32Array.BYTES_PER_ELEMENT * 5,
      },
      close: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 4,
        stride: Float32Array.BYTES_PER_ELEMENT * 5,
      },
    },

    uniforms: {
      timeframe: regl.prop("timeframe"),
      color: regl.prop("color"),
      projection: regl.prop("projection"),
    },

    count: segments.length,

    instances: regl.prop("segments"),

    viewport: regl.prop("viewport"),
  });
}
