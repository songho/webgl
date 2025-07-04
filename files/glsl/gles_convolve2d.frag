///////////////////////////////////////////////////////////////////////////////
// gles_convolve2d.frag
// ====================
// 2d convolution with 3x3 kernel
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-09-26
// UPDATED: 2025-07-03
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// constants
const int ROWS = 3;
const int COLS = 3;
const int CENTER = 1;

// uniforms
uniform float kernel[COLS * ROWS];      // 3x3
uniform vec2 imageDimension;
uniform sampler2D map0;                 // input image

// input varying vars
varying vec2 texCoord0;

void main(void)
{
    vec3 color = vec3(0.0);
    vec2 offset;
    for(int i = 0; i < ROWS; ++i)
    {
        for(int j = 0; j < COLS; ++j)
        {
            offset = vec2(float(CENTER - i) / imageDimension.x, float(CENTER - j) / imageDimension.y);
            color += texture2D(map0, texCoord0 + offset).rgb * kernel[i*COLS+j];
        }
    }
    gl_FragColor = vec4(color, 1.0);
}
