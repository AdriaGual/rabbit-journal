import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, OrthographicCamera } from '@react-three/drei';
import { useState, useRef, useEffect } from 'react';

// Helper function to generate positions for decorations
const getDecorationPosition = (platform, type) => {
  switch (type) {
    case 'tree':
      return [
        platform.position[0] + 9.25 + Math.random() * 0.75, // Randomize X between 9.25 and 10
        platform.position[1],
        platform.position[2] - 2.2,
      ];
    case 'bush':
      return [
        platform.position[0] + 14.3,
        platform.position[1] - 2,
        platform.position[2] + 1.5,
      ];
    default:
      return platform.position;
  }
};

// Platform component for displaying the platform
function Platform({ position, onClick }) {
  const { scene } = useGLTF('/assets/tile.glb');
  const clonedScene = scene.clone(); // Clone the scene to avoid conflicts
  return (
    <primitive
      object={clonedScene}
      position={position}
      onClick={onClick}
      scale={[0.5, 0.5, 0.5]} // Adjust scale if needed
    />
  );
}

// Bunny component for handling bunny animations and position
function Bunny({ position, isJumping }) {
  const { scene } = useGLTF('/assets/cute_rabbit.glb');
  const bunnyRef = useRef();
  const [jumpHeight, setJumpHeight] = useState(0);

  useFrame(() => {
    if (isJumping) {
      if (jumpHeight < 2) setJumpHeight(jumpHeight + 0.1);
    } else if (jumpHeight > 0) setJumpHeight(jumpHeight - 0.1);

    if (bunnyRef.current) {
      bunnyRef.current.position.set(position[0] + 4.5, position[1] + jumpHeight, position[2] - 0.1);
    }
  });

  return <primitive ref={bunnyRef} object={scene} position={[position[0] + 1.75, position[1] + 1.75, position[2]]} scale={[0.3, 0.3, 0.3]} />;
}

// Decoration component for displaying trees, bushes, or any other decoration
function Decoration({ position, type }) {
  const { scene } = useGLTF(`/assets/${type}.glb`);
  const clonedScene = scene.clone();
  return <primitive object={clonedScene} position={position} scale={[0.5, 0.5, 0.5]} />;
}

// Camera component to control camera movement based on bunny's position
function Camera({ bunnyPosition }) {
  const cameraRef = useRef();

  useFrame(() => {
    if (cameraRef.current) {
      cameraRef.current.position.set(bunnyPosition[0] + 8, bunnyPosition[1] + 15, bunnyPosition[2] + 20);
      cameraRef.current.lookAt(bunnyPosition[0] + 3, bunnyPosition[1], bunnyPosition[2]);
    }
  });

  return <OrthographicCamera ref={cameraRef} makeDefault zoom={70} />;
}

export default function App() {
  const numPlatforms = 20; // Total number of platforms
  const columns = [-5, 0, 5]; // X positions for the columns
  const spacingY = -5; // Vertical spacing between platforms
  const [currentLevel, setCurrentLevel] = useState(1); // Current level
  const [isJumping, setIsJumping] = useState(false);

  // Generate platforms with levels
  const columnPattern = [-5, 0, 5, 0]; // Defineix el patró 5, 0, -5, 0
  const platforms = Array.from({ length: numPlatforms }, (_, i) => {
    const level = i + 1;
    const adjustedX = columnPattern[i % columnPattern.length]; // Alterna segons el patró
    const adjustedY = i * spacingY;
  
    return {
      position: [adjustedX, adjustedY, 0.5],
      level,
    };
  });

  const [bunnyPosition, setBunnyPosition] = useState([
    platforms[0].position[0] + 0.1, 
    platforms[0].position[1] + 2, 
    platforms[0].position[2]
  ]);
  const [decorations, setDecorations] = useState([]);

  useEffect(() => {
    const generatedDecorations = platforms.flatMap((platform) => {
      if (Math.random() > 0.3) { // 30% chance to add a decoration
        const types = ['tree', 'bush'];
        const type = types[Math.floor(Math.random() * types.length)];
        return {
          position: getDecorationPosition(platform, type),
          type,
        };
      }
      return [];
    });
    setDecorations(generatedDecorations); // Store generated decorations
  }, []);

  const handlePlatformClick = (platform) => {
    const { position, level } = platform;

    // Allow jumping only to adjacent levels
    if (Math.abs(level - currentLevel) === 1) {
      setIsJumping(true);
      setTimeout(() => {
        setBunnyPosition([position[0] + 0.1 , position[1] + 2.1, position[2]]);
        setCurrentLevel(level);
        setIsJumping(false);
      }, 200);
    }
  };

  return (
    <Canvas style={{ height: '100vh', width: '100vw' }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 10]} intensity={4} castShadow />
      
      {platforms.map((platform, i) => (
        <Platform key={i} position={platform.position} onClick={() => handlePlatformClick(platform)} />
      ))}
      {decorations.map((decoration, i) => (
        <Decoration key={i} position={decoration.position} type={decoration.type} />
      ))}
      
      <Bunny position={bunnyPosition} isJumping={isJumping} />
      <OrbitControls />
      <Camera bunnyPosition={bunnyPosition} />
    </Canvas>
  );
}
