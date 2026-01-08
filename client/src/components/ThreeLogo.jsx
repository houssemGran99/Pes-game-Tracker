import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeLogo() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Clear container to prevent duplicate canvases (HMR/Cleanup safety)
        while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
        }

        // Scene Setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // Square aspect ratio

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(200, 200);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // --- Football Construction ---
        const footballGroup = new THREE.Group();
        // scene.add(footballGroup); // Will be added to mainGroup later

        // 1. Base Sphere (White)
        const ballRadius = 2;
        const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.1
        });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        footballGroup.add(ball);

        // 2. Black Pentagons (placed at vertices of an Icosahedron)
        // An Icosahedron has 12 vertices. A classic football has 12 pentagons.
        // We generate a dummy icosahedron to get coordinate data.
        const icoGeometry = new THREE.IcosahedronGeometry(ballRadius + 0.01, 0); // slightly larger so patches sit on top
        const positions = icoGeometry.attributes.position;

        const pentagonGeometry = new THREE.CircleGeometry(0.65, 5); // Radius tuned visually
        const pentagonMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.6,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positions, i);

            const patch = new THREE.Mesh(pentagonGeometry, pentagonMaterial);
            patch.position.copy(vertex);
            patch.lookAt(0, 0, 0); // Face center
            footballGroup.add(patch);
        }

        // ... Football Construction (previous code) ...

        // --- Fire Effect ---
        // Generate a fire texture procedurally
        const getFireTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(255, 255, 200, 1)'); // Hot center
            gradient.addColorStop(0.4, 'rgba(255, 100, 0, 1)'); // Orange/Red
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fade
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 32, 32);
            return new THREE.CanvasTexture(canvas);
        };

        const fireTexture = getFireTexture();
        const fireMaterial = new THREE.SpriteMaterial({
            map: fireTexture,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleCount = 60;
        const particles = [];
        // Main group to hold everything and handle movement
        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        // Add football to main group
        mainGroup.add(footballGroup);

        const fireGroup = new THREE.Group();
        mainGroup.add(fireGroup); // Add fire to main group so it follows position

        for (let i = 0; i < particleCount; i++) {
            const sprite = new THREE.Sprite(fireMaterial);
            // Randomize initial state
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1.5; // Emit from within the ball radius roughly
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 2;

            sprite.position.set(x, y, z);
            sprite.scale.set(1.5, 1.5, 1.5);

            // Custom data for animation
            sprite.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.05, // Random X drift
                    0.05 + Math.random() * 0.05,  // Fast Upward
                    (Math.random() - 0.5) * 0.05  // Random Z drift
                ),
                life: Math.random() // Random start life
            };

            fireGroup.add(sprite);
            particles.push(sprite);
        }

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        // Add a flickering orange light for the fire
        const fireLight = new THREE.PointLight(0xff4500, 2, 8);
        scene.add(fireLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        // Remove rim light, create cleaner look
        // const rimLight = new THREE.PointLight(0x00d4ff, 0.5);
        // scene.add(rimLight);

        camera.position.z = 8; // Pull back slightly to allow movement

        // Animation Loop
        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);

            // Rotate Ball Even Faster
            footballGroup.rotation.x += 0.04;
            footballGroup.rotation.y += 0.08;
            footballGroup.rotation.z += 0.02;

            // Movement (Lissajous Figure-8) - Vroom
            const time = Date.now() * 0.005;
            mainGroup.position.x = Math.sin(time) * 2;
            mainGroup.position.y = Math.sin(time * 2) * 0.8;
            mainGroup.position.z = Math.cos(time) * 0.8;

            // Fire Light Flicker & Follow
            fireLight.intensity = 2 + Math.sin(time * 10) * 0.5;
            fireLight.position.copy(mainGroup.position);

            // Animate Particles
            particles.forEach(p => {
                p.userData.life -= 0.02; // Decay

                // Move (Local space, so Up is Up)
                p.position.add(p.userData.velocity);
                p.position.y += 0.02;

                // Scale
                const s = Math.max(0, p.userData.life * 2);
                p.scale.set(s, s, s);
                p.material.opacity = p.userData.life;

                // Reset
                if (p.userData.life <= 0) {
                    p.userData.life = 1;
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * 1.8;
                    // Reset relative to group center (0,0,0)
                    p.position.set(
                        Math.cos(angle) * r,
                        -1 + Math.random(),
                        Math.sin(angle) * r
                    );
                }
            });

            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(frameId);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            ballGeometry.dispose();
            ballMaterial.dispose();
            icoGeometry.dispose();
            pentagonGeometry.dispose();
            pentagonMaterial.dispose();
            fireMaterial.dispose();
            fireTexture.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={mountRef}
            className="three-logo-container"
            style={{
                width: '200px',
                height: '200px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '-20px',
                cursor: 'pointer'
            }}
        />
    );
}
