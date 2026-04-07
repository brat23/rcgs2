export function setupRoomEnvironment() {
  if (THREE.RoomEnvironment) return;

  THREE.RoomEnvironment = function () {
    const scene = new THREE.Scene();
    const geometry = new THREE.SphereGeometry(10, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x444444,
      side: THREE.BackSide,
      roughness: 1,
      metalness: 0,
    });
    scene.add(new THREE.Mesh(geometry, material));
    [
      [new THREE.Color(1, 1, 1), [0, 5, 0]],
      [new THREE.Color(0.8, 0.8, 1), [-5, 2, 5]],
      [new THREE.Color(1, 0.9, 0.8), [5, 2, -3]],
    ].forEach(([color, pos]) => {
      const light = new THREE.PointLight(color, 1.5, 15);
      light.position.set(...pos);
      scene.add(light);
    });
    return scene;
  };
}
