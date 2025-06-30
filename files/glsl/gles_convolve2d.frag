///////////////////////////////////////////////////////////////////////////////
// gles_blurGaussian.frag
// ======================
// blur image with separable gaussian kernel
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-09-26
// UPDATED: 2025-00-05
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

const float ZERO = 0.0;
const float ONE  = 1.0;
const int MAX_KERNEL = 21;              // max half kernel size including the center

// uniforms
uniform float kernel[MAX_KERNEL];       // half gaussian kernel from center
uniform int kernelSize;                 // half kernel size including center
uniform float imageWidth;
uniform float imageHeight;
uniform sampler2D map0;                 // input image

// input varying vars
varying vec2 texCoord0;

// linear sampling simplication by Daniel Rakos
//float offset[3];
//float weight[3];
//float offset[3] = float[](0.0, 1.3846153846, 3.2307692308);
//float weight[3] = float[](0.2270270270, 0.3162162162, 0.0702702703);


const float weight0 = 0.2270270270;
const float weight1 = 0.3162162162;
const float weight2 = 0.0702702703;

const float offset1 = 1.3846153846;
const float offset2 = 3.2307692308;



void main(void)
{
    vec3 color = texture2D(map0, texCoord0).rgb * weight0;
    color += texture2D(map0, texCoord0 + vec2(offset1/imageWidth, ZERO)).rgb * weight1;
    color += texture2D(map0, texCoord0 + vec2(offset2/imageWidth, ZERO)).rgb * weight2;
    color += texture2D(map0, texCoord0 + vec2(-offset1/imageWidth, ZERO)).rgb * weight1;
    color += texture2D(map0, texCoord0 + vec2(-offset2/imageWidth, ZERO)).rgb * weight2;

    gl_FragColor = vec4(color, 1.0);
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
