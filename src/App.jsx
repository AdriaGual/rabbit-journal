import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, OrthographicCamera } from '@react-three/drei';
import { useState, useRef } from 'react';

// Component per carregar i mostrar la plataforma
function Platform({ position, onClick }) {
  const { scene } = useGLTF('/assets/tile.glb');
  const clonedScene = scene.clone(); // Clonem l'escena per evitar conflictes entre múltiples instàncies
  return (
    <primitive
      object={clonedScene}
      position={position}
      onClick={onClick}
      scale={[0.5, 0.5, 0.5]} // Ajustem escala si cal
    />
  );
}

// Component per carregar i mostrar el conill
function Bunny({ position, isJumping }) {
  const { scene } = useGLTF('/assets/cute_rabbit.glb');
  const bunnyRef = useRef();
  const [jumpHeight, setJumpHeight] = useState(0);

  useFrame(() => {
    if (isJumping) {
      if (jumpHeight < 2) {
        setJumpHeight(jumpHeight + 0.1); // Augmentem el salt
      }
    } else if (jumpHeight > 0) {
      // Baixada després del salt
      setJumpHeight(jumpHeight - 0.1);
    }

    // Actualitzem la posició del conill
    if (bunnyRef.current) {
      bunnyRef.current.position.y = position[1] + jumpHeight;
      bunnyRef.current.position.x = position[0] + 1.75;
    }
  });

  const adjustedPosition = [position[0] + 1.75, position[1] + 1.75, position[2]]; // Ajustem posició Y
  return <primitive ref={bunnyRef} object={scene} position={adjustedPosition} scale={[0.3, 0.3, 0.3]} />;
}

// Componente que controla la càmera
function Camera({ bunnyPosition }) {
  const cameraRef = useRef();

  // Actualitzar la posició de la càmera per apuntar al conill
  useFrame(() => {
    if (cameraRef.current && bunnyPosition) {
      // Fem que la càmera segueixi al conill amb vista isomètrica
      cameraRef.current.position.x = bunnyPosition[0] + 5; // Posició X de la càmera
      cameraRef.current.position.y = bunnyPosition[1] + 5; // Posició Y de la càmera
      cameraRef.current.position.z = bunnyPosition[2] + 10; // Posició Z de la càmera

      cameraRef.current.lookAt(bunnyPosition[0], bunnyPosition[1], bunnyPosition[2] + 1); // Apunta la càmera cap al conill
    }
  });

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      left={-10}
      right={10}
      top={5}
      bottom={-5}
      zoom={0.5} // Ajustem el zoom per reduir la profunditat
    />
  );
}

export default function App() {
  const numPlatforms = 20; // Total number of platforms
  const columns = [-5, 0, 5]; // X positions for the three columns
  const spacingY = -5; // Vertical spacing between platforms
  const horizontalOffset = 0.5; // Small offset for better distribution

  // Generate platforms with levels
  const platforms = Array.from({ length: numPlatforms }, (_, i) => {
    const level = i + 1; // Assign a unique level for each platform
    const columnIndex = i % columns.length; // Current column (0, 1, or 2)
    const zigzagColumn = Math.floor(i / columns.length) % 2 === 0
      ? columnIndex // Left to right
      : columns.length - 1 - columnIndex; // Right to left

    const adjustedX = columns[zigzagColumn] + (columnIndex === 1 ? horizontalOffset : 0); // Slightly adjust center column
    const adjustedY = i * spacingY;

    return {
      position: [adjustedX, adjustedY, 0],
      level,
    };
  });

  const [bunnyPosition, setBunnyPosition] = useState([
    platforms[0].position[0],
    platforms[0].position[1] + 1.7,
    platforms[0].position[2],
  ]);
  const [currentLevel, setCurrentLevel] = useState(1); // Start at level 1
  const [isJumping, setIsJumping] = useState(false);

  const handlePlatformClick = (platform) => {
    const { position, level } = platform;

    // Allow jumping only to adjacent levels
    if (Math.abs(level - currentLevel) === 1) {
      setIsJumping(true);
      setTimeout(() => {
        setBunnyPosition([position[0], position[1] + 1.7, position[2]]); // Update bunny position
        setCurrentLevel(level); // Update current level
        setIsJumping(false);
      }, 250); // Duration of the jump
    }
  };

  return (
    <Canvas style={{ height: '100vh', width: '100vw' }}>
      <ambientLight />
      {platforms.map((platform, i) => (
        <Platform
          key={i}
          position={platform.position}
          onClick={() => handlePlatformClick(platform)}
        />
      ))}
      <Bunny position={bunnyPosition} isJumping={isJumping} />
      <OrbitControls />
      <Camera bunnyPosition={bunnyPosition} />
    </Canvas>
  );
}