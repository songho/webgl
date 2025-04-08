///////////////////////////////////////////////////////////////////////////////
// gles_wireframe.frag
// ===================
// wireframe shading
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2016-09-25
// UPDATED: 2024-04-15
///////////////////////////////////////////////////////////////////////////////

// included in ES 3.0 (WebGL 2.0)
//#extension GL_OES_standard_derivatives : enable
//#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif


const float ONE  = 1.0;
const float ZERO = 0.0;

// uniforms
uniform vec4 materialDiffuse;           // material diffuse color

// varying vars
varying vec3 barycentricVec;            // barycentric coords

void main(void)
{
    vec3 h = smoothstep(vec3(ZERO), fwidth(barycentricVec)*2.0, barycentricVec);
    //vec3 h = step(fwidth(barycentricVec)*250.0, barycentricVec);
    //vec3 h = mix(vec3(ZERO), fwidth(barycentricVec)*500.0, barycentricVec);
    //vec3 h = fwidth(barycentricVec)*100.0;
    //vec3 h = dFdy(barycentricVec)*100.0;
    float m = min(min(h.x, h.y), h.z);

    gl_FragColor = vec4(vec3(m), ONE);
    //gl_FragColor = vec4(h, ONE);
    /*
    if(any(lessThan(barycentricVec, vec3(0.015))))
    {
        gl_FragColor = vec4(ZERO, ZERO, ZERO, ONE);
    }
    else
    {
        gl_FragColor = materialDiffuse;
    }
    */
}
