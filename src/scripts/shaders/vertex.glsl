precision mediump float;

varying vec2 vUv;
varying float vFrontShadow;

uniform float uAngle;
uniform float uProgress;
uniform float uOmega;

const float PI = 3.1415926;

// ロドリゲスの回転公式
mat4 rotationMatrix(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  float m1 = oc * axis.x * axis.x + c;
  float m2 = oc * axis.x * axis.y - axis.z * s;
  float m3 = oc * axis.z * axis.x + axis.y * s;
  float m4 = oc * axis.x * axis.y + axis.z * s;
  float m5 = oc * axis.y * axis.y + c;
  float m6 = oc * axis.y * axis.z - axis.x * s;
  float m7 = oc * axis.z * axis.x - axis.y * s;
  float m8 = oc * axis.y * axis.z + axis.x * s;
  float m9 = oc * axis.z * axis.z + c;

  return mat4(
    m1, m2, m3, 0.0,
    m4, m5, m6, 0.0,
    m7, m8, m9, 0.0,
    0.0, 0.0, 0.0, 1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}

void main() {
  vUv = uv;
  // 最終的な角度、uOmegaは揺れの大きさ
  float finalAngle = uAngle + uOmega * sin(uProgress * 6.0);

  vec3 newPosition = position;

  float rad = 0.1; // 半径
  float rolls = 8.0; // ロールの巻き回数

  // 座標系を回転させる
  newPosition = rotate(
    newPosition - vec3(-0.5, 0.5, 0.0),
    vec3(0.0, 0.0, 1.0),
    - finalAngle
  ) + vec3(-0.5, 0.5, 0.0);

  // -0.5 ~ 0.5 -> 0.0 ~ 1.0
  float offs = (newPosition.x + 0.5) / (sin(finalAngle) + cos(finalAngle));
  // 切り替え係数(tProgress)を計算する
  float tProgress = clamp((uProgress - offs * 0.99) / 0.01, 0.0, 1.0);

  vFrontShadow = clamp((uProgress - offs * 0.95) / 0.05, 0.7, 1.0);

  newPosition.z = rad + rad * (1.0 - offs / 2.0) * sin(-offs * rolls * PI - 0.5 * PI);
  newPosition.x = -0.5 + rad * (1.0 - offs / 2.0) * cos(-offs * rolls * PI + 0.5 * PI);

  // 元の角度に戻す
  newPosition = rotate(
    newPosition - vec3(-0.5, 0.5, 0.0),
    vec3(0.0, 0.0, 1.0),
    finalAngle
  ) + vec3(-0.5, 0.5, 0.0);

  // 巻き回転(立体化)
  newPosition = rotate(
    newPosition - vec3(-0.5, 0.5, rad),
    vec3(sin(finalAngle), cos(finalAngle), 0.0),
    -PI * uProgress * rolls
  );

  // 位置補正
  newPosition += vec3(
    -0.5 + uProgress * cos(finalAngle) * (sin(finalAngle) + cos(finalAngle)),
    0.5 - uProgress * sin(finalAngle) * (sin(finalAngle) + cos(finalAngle)),
    rad * (1.0 - uProgress / 2.0)
  );

  // 元の形との補間
  vec3 finalposition = mix(newPosition, position, tProgress);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalposition, 1.0 );
}