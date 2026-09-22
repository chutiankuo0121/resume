import * as THREE from "three";

// CPU 数据可跨场景复用；GPU 对象由各场景独立释放。
// 共享 Promise 避免 React Strict Mode 重挂载时重复请求或中断其他调用方。
const buffers = new Map<string, Promise<ArrayBuffer>>();

export function loadBuffer(url: string): Promise<ArrayBuffer> {
  const cached = buffers.get(url);
  if (cached) return cached;
  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return response.arrayBuffer();
    })
    .catch((error) => {
      buffers.delete(url); // 失败不缓存，允许界面重试。
      throw error;
    });
  buffers.set(url, request);
  return request;
}

export function createParticleGeometry(data: ArrayBuffer) {
  // 文件头：ASTR 标记、点数；分列存储坐标、亮度、尺寸和空间点标记。
  if (data.byteLength < 8) throw new Error("粒子文件不完整");
  const [magic, count] = new Uint32Array(data, 0, 2);
  if (magic !== 0x41535452 || count === 0 || data.byteLength !== 8 + count * 9)
    throw new Error("粒子文件格式无效");

  const encoded = new Int16Array(data, 8, count * 3);
  const positions = Float32Array.from(encoded, (value) => value / 2048);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute(
    "aLight",
    new THREE.BufferAttribute(
      new Uint8Array(data, 8 + count * 6, count),
      1,
      true,
    ),
  );
  geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(new Uint8Array(data, 8 + count * 7, count), 1),
  );
  geometry.setAttribute(
    "aAmbient",
    new THREE.BufferAttribute(new Uint8Array(data, 8 + count * 8, count), 1),
  );
  return geometry;
}
