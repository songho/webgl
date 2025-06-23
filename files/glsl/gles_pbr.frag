///////////////////////////////////////////////////////////////////////////////
// gles_pbr.vert
// =============
// GGX microfacet BRDF shader
// Reference:
// - https://www.mathematik.uni-marburg.de/~thormae/lectures/graphics1/graphics_10_1_eng_web.html
// - https://google.github.io/filament/Filament.md.html
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          positionVec
// matrixModelView              vertexNormal            normalVec
// matrixModelViewProjection
// lightPosition
// lightColor
// materialAmbient
// materialDiffuse
// roughness
// metalness
// reflectance
// irradiance
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2025-06-23
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// constants
const float PI_INV = 0.318309886;

// uniforms
uniform vec4 lightColor;
uniform vec4 lightPosition;             // should be in the eye space
uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialDiffuse;           // material diffuse color
uniform float roughness;                // [0, 1]
uniform float metalness;                // [0, 1]
uniform float reflectance;              // [0, 1], f0 reflectance
uniform float irradiance;               // total amount of light energy from all direction
//uniform sampler2D map0;                 // texture map #1

// varying variables
varying vec3 positionVec;               // vertex position in eye space
varying vec3 normalVec;                 // normal vector in eye space
//varying vec2 texCoord0;


///////////////////////////////////////////////////////////////////////////////
// fresnel reflectance approx. for specular
// F(v,h) = f0 + (1 - f0) * (1 - v.h)^5
// f0: specular reflectance at normal incidence (water=2%, plastic=4%, iron=60%, aluminum=90%)
// f90: specular reflectance at grazing angle(90 degree), normally 100% 
///////////////////////////////////////////////////////////////////////////////
vec3 F_Schlick(float dotVH, vec3 f0)
{
    return f0 + (1.0 - f0) * pow(1.0 - dotVH, 5.0);
}
float F_Schlick90(float dotVH, float f0, float f90)
{
    return f0 + (f90 - f0) * pow(1.0 - dotVH, 5.0);
}


///////////////////////////////////////////////////////////////////////////////
// normal distribution function for specular
// D(n,h) = a^2 / (PI * ((n.h)^2 * (a^2 - 1) + 1)^2)
// a = roughness * roughness
///////////////////////////////////////////////////////////////////////////////
float D_GGX(float dotNH, float roughness)
{
    float a = roughness * roughness;
    float a2 = a * a;
    float b = (dotNH * dotNH * (a2 - 1.0) + 1.0);
    return a2 * PI_INV / (b * b);
}


///////////////////////////////////////////////////////////////////////////////
// geometry function of shadowing/masking approx. for specular
// G(l,v) = G1(l) * G1(v)
// G1(l) = n.l / (n.l * (1 - k) + k)
// G1(v) = n.v / (n.v * (1 - k) + k)
// k = (roughness * roughness) / 2
///////////////////////////////////////////////////////////////////////////////
float G1_GGX_Schlick(float dotNV, float roughness)
{
    float k = (roughness * roughness) / 2.0;
    //return max(dotNV, 0.001) / (dotNV * (1.0 - k) + k);
    return dotNV / (dotNV * (1.0 - k) + k); // 1 means no interference
}
float G_Smith(float dotNL, float dotNV, float roughness)
{
  return G1_GGX_Schlick(dotNL, roughness) * G1_GGX_Schlick(dotNV, roughness);
}



///////////////////////////////////////////////////////////////////////////////
// fresnel reflectance for diffuse
///////////////////////////////////////////////////////////////////////////////
float Fd_Burley(float dotNV, float dotNL, float dotVH, float roughness)
{
    float a = roughness * roughness;
    float f90 = 0.5 + 2.0 * a * dotVH * dotVH;
    float fl = F_Schlick90(dotNL, 1.0, f90);  // light scatter
    float fv = F_Schlick90(dotNV, 1.0, f90);  // view scatter
    return fl * fv;
}
float Fd_Lambert()
{
    return PI_INV;
}


///////////////////////////////////////////////////////////////////////////////
// microfacet BRDF = fs(v,l) + fd(v,l)
// fs(v,l) = (F(v,h) * D(h) * G(v,l)) / (4 * n.l * n.v)
// fd(v,l) = sigma/pi * F(n,l) * F(n,v)
// F: Fresnel Reflectance
// D: Normal Distribution function
// G: Geometry function
///////////////////////////////////////////////////////////////////////////////
vec3 BRDF(vec3 l, vec3 v, vec3 n,
          float metalness, float roughness, float reflectance,
          vec3 materialDiffuse)
{
    vec3 h = normalize(v + l); // half vector
    float dotNL = clamp(dot(n, l), 0.0, 1.0);
    float dotNV = clamp(dot(n, v), 0.0, 1.0);
    float dotNH = clamp(dot(n, h), 0.0, 1.0);
    float dotVH = clamp(dot(v, h), 0.0, 1.0);

    // specular reflectance at normal incidence, angle=0
    vec3 f0 = vec3(reflectance);
    f0 = mix(f0, materialDiffuse, metalness);

    // specular part
    vec3 F = F_Schlick(dotVH, f0);              // fresnel reflectance
    float D = D_GGX(dotNH, roughness);          // normal distribution
    float G = G_Smith(dotNL, dotNV, roughness); // geometry function
    vec3 fs = (F * D * G) / (4.0 *  max(dotNL, 0.001) * max(dotNV, 0.001));

    // diffuse part 
    vec3 fd = materialDiffuse;
    fd *= vec3(1.0) - F;    // conserve energy (fs+fd is less than 1)
    fd *= PI_INV; // with lambert diffise
    //fd *= Fd_Burley(dotNV, dotNL, dotVH, roughness); // with burley diffuse
    fd *= (1.0 - metalness);

    return fd + fs; // diffuse + specular
}


void main(void)
{
    // re-normalize varying vars
    vec3 normal = normalize(normalVec);
    vec3 view = normalize(-positionVec);

    // compute light vector and attenuation
    vec3 light;
    // directional light
    if(lightPosition.w == 0.0)
    {
        light = normalize(lightPosition.xyz);
    }
    // positional light
    else
    {
        // compute light vector in eye space
        light = normalize(lightPosition.xyz - positionVec);
    }

    vec3 radiance = materialAmbient.rgb;
    float irrad = max(dot(light, normal), 0.0) * irradiance;
    vec3 brdf = BRDF(light, view, normal, metalness, roughness, reflectance, materialDiffuse.rgb);
    radiance += brdf * irrad * lightColor.rgb;

    // set frag color
    gl_FragColor = vec4(radiance, materialDiffuse.a);  // keep alpha as original material has
}
