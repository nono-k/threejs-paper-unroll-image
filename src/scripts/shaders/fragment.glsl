precision mediump float;

varying vec2 vUv;
varying float vFrontShadow;

uniform sampler2D uTexture;
uniform float uProgress;

void main() {
  vec4 textureColor = texture2D(uTexture, vUv);
  vec3 color;

  color = textureColor.rgb * vFrontShadow;
  float alpha = clamp(uProgress * 5.0, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}