///////////////////////////////////////////////////////////////////////////////
// gles_blurGaussian.frag
// ======================
// blur image with separable gaussian kernel
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

const int MAX_KERNEL = 21;              // max half kernel size including the center
const float ZERO = 0.0;
const float ONE  = 1.0;

// uniforms
uniform float kernel[MAX_KERNEL];       // half gaussian kernel from center
uniform float imageDimension;
uniform vec2 direction;                 // horizontal=(1,0) or vertical=(0,1)
uniform sampler2D map0;                 // input image

// input varying vars
varying vec2 texCoord0;

void main(void)
{
    // compute the center first
    vec3 color = texture2D(map0, texCoord0).rgb * kernel[0];
    vec2 offset;

    /*
    // compute with other kernel
    for(int i = 1; i < MAX_KERNEL; ++i)
    {
        offset = direction * float(i) / imageDimension;
        color += texture2D(map0, texCoord0 + offset).rgb * kernel[i]; // positive side
        color += texture2D(map0, texCoord0 - offset).rgb * kernel[i]; // negative side
    }
    */

    // optimize using linear texture linear filtering
    float k;    // interpolated kernel
    float t;    // interpolated alpha
    for(int i = 1; i < MAX_KERNEL; i += 2)
    {
        k = kernel[i] + kernel[i+1];
        t = kernel[i+1] / k;
        offset = direction * (float(i) + t) / imageDimension;
        color += texture2D(map0, texCoord0 + offset).rgb * k;
        color += texture2D(map0, texCoord0 - offset).rgb * k;
    }

    gl_FragColor = vec4(color, ONE);
}
