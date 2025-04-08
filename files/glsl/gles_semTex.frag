///////////////////////////////////////////////////////////////////////////////
// gles_semTex.vert
// ================
// Per-Pixel Spherical Environment Map (SEM)
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          positionVec
// matrixModelView              vertexNormal            normalVec
// matrixModelViewProjection    vertexTexCoord0         texCoord0
// materialColor
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2020-02-13
// UPDATED: 2020-02-13
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// constants
const float ZERO = 0.0;
const float HALF = 0.5;
const float ONE  = 1.0;

// uniforms
uniform vec4 materialColor;             // base colour
uniform sampler2D map0;                 // texture map #1

// varying variables
varying vec3 positionVec;               // vertex position in eye space
varying vec3 normalVec;                 // normal vector in eye space
//varying vec2 texCoord0;

void main(void)
{
    // compute tex coord per pixel
    // 1/2*(1/sqrt(x*x + y*y + (z+1)*(z+1)))*(X,Y) + 0.5
    vec3 position = normalize(positionVec);
    vec3 normal = normalize(normalVec);
    vec3 r = reflect(position, normal);
    float scale = HALF / sqrt(r.x * r.x + r.y * r.y + (r.z + ONE) * (r.z + ONE));
    vec2 texCoord0 = vec2(r.x * scale + HALF, -r.y * scale + HALF);

    // modulate colour by spherical map
    vec4 color = materialColor;
    color *= texture2D(map0, texCoord0);

    // set frag color
    gl_FragColor = color;
}
