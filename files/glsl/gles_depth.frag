///////////////////////////////////////////////////////////////////////////////
// gles_depth.frag
// ===============
// flat shader with diffuse color
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2012-09-19
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform float linearDepthFactor;        // 1 / (far - near)

varying vec4 position;



///////////////////////////////////////////////////////////////////////////////
// convert depth buffer value to color buffer value(RGBA)
///////////////////////////////////////////////////////////////////////////////
vec2 convertDepthToRg(float depth)       // to 16bit
{
    vec2 color = vec2(depth, fract(depth * 255.0));
    color -= color.yy * vec2(1.0/255.0, 0.0);
    return color;
}

vec3 convertDepthToRgb(float depth)      // to 24bit
{
    vec3 color = fract(vec3(1.0, 255.0, 65025.0) * depth);
    color -= color.yzz * vec3(1.0/255.0, 1.0/255.0, 0.0);
    return color;
    //float value = depth * (256.0 * 256.6 * 256.0 - 0.1) / (256.0 * 256.0 * 256.0);
    //vec4 encode = fract(value * vec4(1.0, 256.0, 256.0*256.0, 256.0*256.0*256.0));
    //float depthVal = depth * (256.0*256.0*256.0 - 1.0) / (256.0*256.0*256.0);
    //return encode.xyz - encode.yzw / 256.0 + (1.0 / 512.0);
}

vec4 convertDepthToRgba(float depth)    // to 32bit
{
    vec4 color = fract(vec4(1.0, 255.0, 65025.0, 16581375.0) * depth);
    color -= color.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
    return color;
}



void main(void)
{
    // use the linear distance from light, instead of default depth value (gl_FragCoord.z)
    float depth = length(position.xyz) * linearDepthFactor;

    // convert depth value to RGBA
    //gl_FragColor = vec4(convertDepthToRgb(depth), 1.0);
    //gl_FragColor = vec4(convertDepthToRg(gl_FragCoord.z), 1.0, 1.0);
    gl_FragColor = vec4(convertDepthToRgb(gl_FragCoord.z), 1.0);
    //gl_FragColor = convertDepthToRgba(gl_FragCoord.z);
}
