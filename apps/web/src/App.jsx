import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";

/**
 * COMPONENTE: ScrollExplodeCanvas
 * Maneja la lógica de renderizado de la secuencia de imágenes en el Canvas.
 */
const ScrollExplodeCanvas = ({ scrollProgress }) => {
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const frameCount = 120;

  // Transformamos el progreso [0, 1] a índice de frame [1, 120]
  const rawFrameIndex = useTransform(scrollProgress, [0, 1], [1, frameCount]);
  // Suavizamos el movimiento del frame para 60fps constantes
  const smoothFrameIndex = useSpring(rawFrameIndex, {
    stiffness: 300,
    damping: 30,
    restDelta: 0.001,
  });

  // Pre-carga de frames
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages = [];

    const preloadImages = () => {
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        // Construcción de la ruta: hal-Test_frame_0001.webp
        const frameNumber = i.toString().padStart(4, "0");
        img.src = `/frames/hal-Test_frame_${frameNumber}.webp`;

        img.onload = () => {
          loadedCount++;
          setLoadingProgress(Math.floor((loadedCount / frameCount) * 100));
          if (loadedCount === frameCount) {
            setLoaded(true);
          }
        };
        // Fallback para visualización si las imágenes no existen localmente
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === frameCount) setLoaded(true);
        };
        loadedImages[i] = img;
      }
      setImages(loadedImages);
    };

    preloadImages();
  }, []);

  // Loop de renderizado del Canvas
  useEffect(() => {
    if (!loaded || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");

    const render = () => {
      const index = Math.floor(smoothFrameIndex.get());
      const img = images[index];

      if (img && img.complete) {
        const canvas = canvasRef.current;
        // Limpiar y dibujar manteniendo el aspect ratio (contain)
        context.clearRect(0, 0, canvas.width, canvas.height);

        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height,
        );
        const x = canvas.width / 2 - (img.width / 2) * scale;
        const y = canvas.height / 2 - (img.height / 2) * scale;

        context.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
      requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    const animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [loaded, images, smoothFrameIndex]);

  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center bg-transparent">
      <canvas ref={canvasRef} className="w-full h-full object-contain" />

      {/* Loading Screen */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background font-mono"
          >
            <div className="text-white text-xl mb-4 tracking-tighter">
              INITIALIZING HAL_SYSTEM
            </div>
            <div className="w-64 h-[2px] bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="mt-2 text-white/40 text-xs">{loadingProgress}%</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * COMPONENTE: SectionOverlay
 * Controla la visibilidad y animación de los textos según el scroll
 */
const SectionOverlay = ({ scrollProgress }) => {
  // Definición de rangos de visibilidad para cada sección
  const heroOpacity = useTransform(scrollProgress, [0, 0.15], [1, 0]);
  const f1Opacity = useTransform(scrollProgress, [0.2, 0.3, 0.4], [0, 1, 0]);
  const f2Opacity = useTransform(scrollProgress, [0.5, 0.6, 0.7], [0, 1, 0]);
  const ctaOpacity = useTransform(scrollProgress, [0.85, 0.95], [0, 1]);

  const textStyle =
    "text-white font-mono tracking-tight text-center px-6 max-w-4xl select-none";

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
      {/* HERO SECTION */}
      <motion.div style={{ opacity: heroOpacity }} className={textStyle}>
        <h1 className="text-5xl md:text-8xl font-bold uppercase mb-4">
          <span className="text-hal-primary-500">hal</span>
          <span className="text-white">-</span>
          <span className="text-hal-warning-500">Test</span>
        </h1>
        <p className="text-lg md:text-xl text-white/60">
          Modern, visual automation framework.
        </p>
      </motion.div>

      {/* FEATURE 1: 30% */}
      <motion.div style={{ opacity: f1Opacity }} className={textStyle}>
        <h2 className="text-3xl md:text-5xl font-bold uppercase mb-4">
          Visual Flow Editor
        </h2>
        <p className="text-lg md:text-xl text-white/60">
          Orquestación "drag-and-drop" con más de 50 nodos especializados. Sin
          código.
        </p>
      </motion.div>

      {/* FEATURE 2: 60% */}
      <motion.div style={{ opacity: f2Opacity }} className={textStyle}>
        <h2 className="text-3xl md:text-5xl font-bold uppercase mb-4">
          Advanced Control
        </h2>
        <p className="text-lg md:text-xl text-white/60">
          Intercepción de red, integración con IA y gestión de sesiones.
        </p>
      </motion.div>

      {/* CTA: 90% */}
      <motion.div
        style={{ opacity: ctaOpacity }}
        className={`${textStyle} pointer-events-auto`}
      >
        <h2 className="text-4xl md:text-7xl font-bold uppercase mb-8">
          Open Source & Free
        </h2>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <motion.button
            whileHover={{
              scale: 1.05,
              backgroundColor: "var(--hal-primary-500)",
              borderColor: "var(--hal-primary-500)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              window.open("https://hal-test-frontend.vercel.app/", "_blank")
            }
            className="border border-white/20 bg-hal-primary-500/20 text-white px-12 py-4 rounded-full text-lg uppercase font-bold transition-colors backdrop-blur-md hover:bg-hal-primary-500"
          >
            Launch App
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.05,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              window.open("https://github.com/andresguc1/hal-test", "_blank")
            }
            className="flex items-center gap-2 border border-white/20 bg-black/20 text-white px-8 py-4 rounded-full text-lg uppercase font-bold transition-colors backdrop-blur-md"
          >
            <span>★</span> Star on GitHub
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const containerRef = useRef(null);

  // Hook de scroll principal (400vh de altura para dar espacio a la secuencia)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Rotación del logo basada en el scroll
  const logoRotation = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <div className="bg-background min-h-screen text-white">
      {/* Global Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap');
        body { background: #0f172a; margin: 0; cursor: crosshair; }
        ::-webkit-scrollbar { display: none; }
        .font-mono { font-family: 'Geist Mono', monospace; }
      `,
        }}
      />

      {/* Navbar Minimalista */}
      <nav className="fixed top-0 left-0 w-full p-8 z-50 flex justify-between items-center mix-blend-difference font-mono">
        <div className="text-xl font-bold tracking-wider flex items-center gap-3">
          <motion.img
            style={{ rotate: logoRotation }}
            src="/images/haltest_logo.jpeg"
            alt="Hal-Test Logo"
            className="w-8 h-8 rounded-lg"
          />
          <div className="flex items-center gap-2">
            <span className="text-hal-primary-500">HAL</span>
            <span className="text-white/50">-</span>
            <span className="text-hal-warning-500">TEST</span>
          </div>
        </div>
        <div className="text-white/40 text-[10px] uppercase">
          Status: Operating
        </div>
      </nav>

      {/* Contenedor de Scroll */}
      <div ref={containerRef} className="relative h-[400vh]">
        {/* Background GIF (Fallback/Ambient) */}
        <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
          <img
            src="/video/base1.gif"
            alt="Background Animation"
            className="w-full h-full object-cover"
          />
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f172a_100%)]"></div>
        </div>

        {/* Central Rotating Logo Watermark */}
        <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
          <motion.img
            style={{ rotate: logoRotation, opacity: 0.1 }}
            src="/images/haltest_logo.jpeg"
            alt="Hal-Test Logo Watermark"
            className="w-[50vmin] h-[50vmin] rounded-full mix-blend-overlay blur-sm"
          />
        </div>

        {/* Visual Engine */}
        <ScrollExplodeCanvas scrollProgress={scrollYProgress} />

        {/* Content Layers */}
        <SectionOverlay scrollProgress={scrollYProgress} />
      </div>

      {/* Indicador de Scroll lateral */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-8 bg-white/10 rounded-full overflow-hidden"
          >
            <motion.div
              className="w-full bg-white h-full origin-top"
              style={{
                scaleY: useTransform(
                  scrollYProgress,
                  [i * 0.25, (i + 1) * 0.25],
                  [0, 1],
                ),
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
