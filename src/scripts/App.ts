import * as THREE from 'three';
import { Controls, PerspectiveCamera } from './core/Camera';
import { Three } from './core/Three';
import { Gui } from './Gui';
import gsap from 'gsap';

import fragment from './shaders/fragment.glsl?raw';
import vertex from './shaders/vertex.glsl?raw';

export class App extends Three {
  private readonly camera: PerspectiveCamera;
  private mesh!: THREE.Mesh;
  private readonly imageTarget: HTMLElement;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.imageTarget = document.querySelector('.ja-image-target') as HTMLElement;

    this.camera = new PerspectiveCamera({
      fov: 70,
      near: 300,
      far: 1000,
    });

    this.camera.position.z = 400;

    new Controls(this.renderer, this.camera);

    this.loader().then((texture) => {
      this.createGeometry(texture);
      this.setCameraToScreen();
      window.addEventListener('resize', this.resize.bind(this));
      this.renderer.setAnimationLoop(this.animate.bind(this));
    });

    this.clickEvent();
    this.setGui();
  }

  private async loader() {
    const loader = new THREE.TextureLoader();
    const source = this.imageTarget.querySelector('img')?.getAttribute('src');
    const _texture = await loader.loadAsync(source!);
    return _texture;
  }

  private createGeometry(_texture: THREE.Texture) {
    _texture.needsUpdate = true;
    _texture.minFilter = THREE.LinearFilter;

    const geometry = new THREE.PlaneGeometry(1, 1, 80, 80);
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      side: THREE.DoubleSide,
      transparent: true,
      // wireframe: true,
      uniforms: {
        uTexture: { value: _texture },
        uAngle: { value: 0.3 },
        uProgress: { value: 1.0 },
        uOmega: { value: 0.0 },
      },
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  private updateMeshPosition() {
    const rect = this.imageTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const posX = x - window.innerWidth / 2;
    const posY = -(y - window.innerHeight / 2);

    this.mesh.position.set(posX, posY, 0);
    this.mesh.scale.set(rect.width, rect.height, 1);
  }

  private setCameraToScreen() {
    const fov = this.camera.fov * (Math.PI / 180);
    const height = window.innerHeight;
    const distance = height / (2 * Math.tan(fov / 2));
    this.camera.position.z = distance;
  }

  private animate() {
    this.updateMeshPosition();

    this.renderer.render(this.scene, this.camera);
  }

  private resize() {
    this.camera.update();
    this.setCameraToScreen();
  }

  private clickEvent() {
    const buttons = document.querySelectorAll('.js-button');
    buttons.forEach((button) => {

      button.addEventListener('click', (e: Event) => {
        const target = e.currentTarget as HTMLElement;
        const angle = Number(target.dataset.angle) / 180 * Math.PI;

        const meshMaterial = this.mesh.material as THREE.ShaderMaterial;

        if (
          meshMaterial.uniforms.uAngle &&
          meshMaterial.uniforms.uProgress
        ) {
          meshMaterial.uniforms.uAngle.value = angle;

          gsap.fromTo(meshMaterial.uniforms.uProgress, {
            value: 0
          }, {
            value: 1.0,
            duration: 1.5,
          });
        }
      });
    });
  }

  private setGui() {
    const PARAMS = {
      progress: 1.0,
      omega: 0.0,
    };

    const pane = new Gui();
    pane.addBinding(PARAMS, 'progress', { min: 0, max: 1 });
    pane.addBinding(PARAMS, 'omega', { min: 0, max: 0.35, step: 0.01 });
    pane.on('change', () => {
      const meshMaterial = this.mesh.material as THREE.ShaderMaterial;
      if (!meshMaterial.uniforms.uProgress || !meshMaterial.uniforms.uOmega) return;
      meshMaterial.uniforms.uProgress.value = PARAMS.progress;
      meshMaterial.uniforms.uOmega.value = PARAMS.omega;
    });
  }
}

const app = new App(document.getElementById('webgl') as HTMLCanvasElement);

window.addEventListener('beforeunload', () => {
  app.dispose();
});