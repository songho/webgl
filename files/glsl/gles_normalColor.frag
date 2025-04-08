///////////////////////////////////////////////////////////////////////////////
// gles_normalColor.frag
// =====================
// visualizing normal vectors as surface color
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          positionVec
// matrixModelView              vertexNormal            normalVec
// matrixModelViewProjection
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2023-03-22
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// varying variables
//varying vec3 positionVec;               // vertex position in eye space
varying vec3 normalVec;                 // normal vector in eye space

void main(void)
{
    // re-normalize varying vars
    vec3 normal = normalize(normalVec);

    // set frag color from normal
    gl_FragColor = vec4(normalVec, ONE);
}
