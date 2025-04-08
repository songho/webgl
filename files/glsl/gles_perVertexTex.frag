///////////////////////////////////////////////////////////////////////////////
// gles_perVertex.frag
// ===================
// Per-Vertex lighting shader (Gouraud shading) with single light source
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          color
// matrixModelView              vertexNormal            texCoord0
// matrixModelViewProjection    vertexTexCoord0
// lightPosition
// lightColor
// lightAttenuations
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
// map0
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2011-02-01
// UPDATED: 2023-03-30
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform sampler2D map0;                 // texture map #1

// varying variables from vertex shader
varying vec4 color;
varying vec2 texCoord0;

void main(void)
{
    vec4 texel = texture2D(map0, texCoord0);
    gl_FragColor = color * texel;
}
