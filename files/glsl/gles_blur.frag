///////////////////////////////////////////////////////////////////////////////
// gles_blur.frag
// ==============
// blur image with gaussian
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-09-26
// UPDATED: 2012-09-26
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform float imageWidth;
uniform float imageHeight;
uniform sampler2D map0;                 // base texture map

varying vec2 texCoord;

// linear sampling simplication by Daniel Rakos
//float offset[3];
//float weight[3];
//float offset[3] = float[](0.0, 1.3846153846, 3.2307692308);
//float weight[3] = float[](0.2270270270, 0.3162162162, 0.0702702703);

const float zero = 0.0;
const float one  = 1.0;

const float weight0 = 0.2270270270;
const float weight1 = 0.3162162162;
const float weight2 = 0.0702702703;

const float offset1 = 1.3846153846;
const float offset2 = 3.2307692308;



void main(void)
{
    vec3 color = texture2D(map0, texCoord).rgb * weight0;
    color += texture2D(map0, texCoord + vec2(offset1/imageWidth, zero)).rgb * weight1;
    color += texture2D(map0, texCoord + vec2(offset2/imageWidth, zero)).rgb * weight2;
    color += texture2D(map0, texCoord + vec2(-offset1/imageWidth, zero)).rgb * weight1;
    color += texture2D(map0, texCoord + vec2(-offset2/imageWidth, zero)).rgb * weight2;

    gl_FragColor = vec4(color, 1.0);
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
