///////////////////////////////////////////////////////////////////////////////
// gles_convolve1d.frag
// ====================
// 1D convolution
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-09-26
// UPDATED: 2025-06-05
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

const int MAX_KERNEL = 21;              // max kernel size (odd number)
const int CENTER = MAX_KERNEL / 2;      // center index

// uniforms
uniform float kernel[MAX_KERNEL];       // kernel with paddings
uniform float imageDimension;           // imade width or height
uniform vec2 direction;                 // convolve direction; hori=(1,0), vert=(0,1)
uniform sampler2D map0;                 // input image

// input varying vars
varying vec2 texCoord0;

void main(void)
{
    vec3 color = vec3(0.0);
    vec2 offset;

    // convolve
    for(int i = 0; i < MAX_KERNEL; ++i)
    {
        offset =  direction * float(CENTER - i) / imageDimension;
        color += texture2D(map0, texCoord0 + offset).rgb * kernel[i];
    }

    gl_FragColor = vec4(color, 1.0);
}
