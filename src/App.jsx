import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, OrthographicCamera } from '@react-three/drei';
import { useState, useRef, useEffect } from 'react';

// Component for loading and displaying the platform
function Platform({ position, onClick }) {
  const { scene } = useGLTF('/assets/tile.glb');
  const clonedScene = scene.clone(); // Clone the scene to avoid conflicts between multiple instances
  return (
    <primitive
      object={clonedScene}
      position={position}
      onClick={onClick}
      scale={[0.5, 0.5, 0.5]} // Adjust scale if needed
    />
  );
}

// Component for loading and displaying the bunny
function Bunny({ position, isJumping }) {
  const { scene } = useGLTF('/assets/cute_rabbit.glb');
  const bunnyRef = useRef();
  const [jumpHeight, setJumpHeight] = useState(0);

  useFrame(() => {
    if (isJumping) {
      if (jumpHeight < 2) {
        setJumpHeight(jumpHeight + 0.1); // Increase jump height
      }
    } else if (jumpHeight > 0) {
      // Descend after jumping
      setJumpHeight(jumpHeight - 0.1);
    }

    // Update bunny position
    if (bunnyRef.current) {
      bunnyRef.current.position.y = position[1] + jumpHeight;
      bunnyRef.current.position.x = position[0] + 4.5;
      bunnyRef.current.position.z = -0.1;
    }
  });

  const adjustedPosition = [position[0] + 1.75, position[1] + 1.75, position[2]]; // Adjust Y position
  return <primitive ref={bunnyRef} object={scene} position={adjustedPosition} scale={[0.3, 0.3, 0.3]} />;
}

// Component to load and display a decoration (e.g., bush or tree)
function Decoration({ position, type }) {
  const { scene } = useGLTF(`/assets/${type}.glb`);
  const clonedScene = scene.clone(); // Clone the scene to avoid conflicts between multiple instances
  return <primitive object={clonedScene} position={[position[0], position[1], position[2]]} scale={[0.5, 0.5, 0.5]} />;
}

// Component that controls the camera
function Camera({ bunnyPosition }) {
  const cameraRef = useRef();

  useFrame(() => {
    if (cameraRef.current && bunnyPosition) {
      // Set the camera position to follow the bunny but maintain a fixed isometric view
      cameraRef.current.position.set(bunnyPosition[0] + 5, bunnyPosition[1] + 15, bunnyPosition[2] + 20);

      // Keep the camera's orientation fixed at the isometric view
      cameraRef.current.lookAt(bunnyPosition[0], bunnyPosition[1], bunnyPosition[2]);
    }
  });

  return <OrthographicCamera ref={cameraRef} makeDefault zoom={70} />;
}

export default function App() {
  const numPlatforms = 20; // Total number of platforms
  const columns = [-5, 0, 5]; // X positions for the three columns
  const spacingY = -5; // Vertical spacing between platforms
  const [currentLevel, setCurrentLevel] = useState(1); // Start at level 1
  const [isJumping, setIsJumping] = useState(false);

  // Generate platforms with levels
  const platforms = Array.from({ length: numPlatforms }, (_, i) => {
    const level = i + 1; // Assign a unique level for each platform
    const columnIndex = i % columns.length; // Current column (0, 1, or 2)
    const zigzagColumn = Math.floor(i / columns.length) % 2 === 0
      ? columnIndex // Left to right
      : columns.length - 1 - columnIndex; // Right to left

    const adjustedX = columns[zigzagColumn]; // Slightly adjust center column
    const adjustedY = i * spacingY;

    return {
      position: [adjustedX - 2.75, adjustedY, 0.5],
      level,
    };
  });

  const [bunnyPosition, setBunnyPosition] = useState([
    platforms[0].position[0],
    platforms[0].position[1] + 1.68,
    platforms[0].position[2],
  ]);

  const [decorations, setDecorations] = useState([]); // Store decorations in state

  useEffect(() => {
    const generatedDecorations = platforms.map((platform) => {
      // Generate decorations only for level 1
      if (Math.random() > 0.3) { // 30% chance to add a decoration
        const isTree = Math.random() > 0.5; // 50% chance for a tree or bush
        const decorationType = isTree ? 'tree' : 'bush'; // Randomly select tree or bush
  
        // Adjust positions based on the decoration type
        const position = isTree
          ? [
              platform.position[0] + 9.25 + Math.random() * 0.75, // Random value between 9.25 and 10
              platform.position[1],
              platform.position[2] - 2.2
            ] // Tree position with random X adjustment
          : [platform.position[0] + 14.3, platform.position[1] - 2, platform.position[2] + 1.5]; // Bush position
  
        return {
          position, // Adjusted position based on decoration type
          type: decorationType,
        };
      }
      return null;
    }).filter(Boolean);
  
    setDecorations(generatedDecorations); // Store the decorations once
  }, []);

  const handlePlatformClick = (platform) => {
    const { position, level } = platform;

    // Allow jumping only to adjacent levels
    if (Math.abs(level - currentLevel) === 1) {
      setIsJumping(true);
      setTimeout(() => {
        setBunnyPosition([position[0], position[1] + 1.8, position[2]]); // Update bunny position
        setCurrentLevel(level); // Update current level
        setIsJumping(false);
      }, 200); // Duration of the jump
    }
  };
  console.log(decorations)

  return (
    <Canvas style={{ height: '100vh', width: '100vw' }}>
      <ambientLight intensity={1.5} />
      <directionalLight
        position={[10, 10, 10]} // Light position in the scene
        intensity={4} // Brightness
        castShadow // Enable shadows
      />
      {platforms.map((platform, i) => (
        <Platform
          key={i}
          position={platform.position}
          onClick={() => handlePlatformClick(platform)}
        />
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
