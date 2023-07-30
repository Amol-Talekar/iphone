import React, {
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import {
  ViewerApp,
  AssetManagerPlugin,
  GBufferPlugin,
  timeout,
  ProgressivePlugin,
  TonemapPlugin,
  SSRPlugin,
  SSAOPlugin,
  DiamondPlugin,
  FrameFadePlugin,
  GLTFAnimationPlugin,
  GroundPlugin,
  BloomPlugin,
  TemporalAAPlugin,
  AnisotropyPlugin,
  GammaCorrectionPlugin,
  addBasePlugins,
  TweakpaneUiPlugin,
  AssetManagerBasicPopupPlugin,
  CanvasSnipperPlugin,
  mobileAndTabletCheck,

  // Color, // Import THREE.js internals
  // Texture, // Import THREE.js internals
} from "webgi";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollAnimation } from "../lib/scroll-animation";

gsap.registerPlugin(ScrollTrigger);

const WebgiViewer = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const [viewerRef, setViewerRef] = useState(null);
  const [targetRef, setTargetRef] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [positionRef, setPositionRef] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isMobile, SetIsMobile] = useState(false);
  const canvasContainerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    triggerPreview() {
      setPreviewMode(true);
      canvasContainerRef.current.style.pointerEvents = "all";
      props.contentRef.current.style.opacity = "0";

      gsap.to(positionRef, {
        x: 13.04,
        y: -2.01,
        z: 2.29,
        duration: 2,
        onUpdate: () => {
          viewerRef.setDirty();
          cameraRef.positionTargetUpdated(true);
        },
      });

      gsap.to(targetRef, {
        x: 0.11,
        y: 0.0,
        z: 0.0,
        duration: 2,
      });

      viewerRef.scene.activeCamera.setCameraOptions({ controlsEnabled: true });
    },
  }));

  const memoizedScrollAnimation = useCallback(
    (position, target, isMobile, onUpdate) => {
      if (position && target && onUpdate) {
        scrollAnimation(position, target, isMobile, onUpdate);
      }
    },
    []
  );

  const setupViewer = useCallback(async () => {
    // Initialize the viewer
    const viewer = new ViewerApp({
      canvas: canvasRef.current,
    });
    setViewerRef(viewer);
    const isMobileorTablet = mobileAndTabletCheck();
    SetIsMobile(isMobileorTablet);

    // Add some plugins
    const manager = await viewer.addPlugin(AssetManagerPlugin);

    const camera = viewer.scene.activeCamera;
    const position = camera.position;
    const target = camera.target;

    setCameraRef(camera);
    setPositionRef(position);
    setTargetRef(target);

    // Add a popup(in HTML) with download progress when any asset is downloading.
    // await viewer.addPlugin(AssetManagerBasicPopupPlugin);

    // Add plugins individually.
    await viewer.addPlugin(GBufferPlugin);
    await viewer.addPlugin(new ProgressivePlugin(32));
    await viewer.addPlugin(new TonemapPlugin(true));
    await viewer.addPlugin(GammaCorrectionPlugin);
    await viewer.addPlugin(SSRPlugin);
    await viewer.addPlugin(SSAOPlugin);
    // await viewer.addPlugin(DiamondPlugin)
    // await viewer.addPlugin(FrameFadePlugin)
    // await viewer.addPlugin(GLTFAnimationPlugin)
    // await viewer.addPlugin(GroundPlugin)
    await viewer.addPlugin(BloomPlugin);
    // await viewer.addPlugin(TemporalAAPlugin)
    // await viewer.addPlugin(AnisotropyPlugin)
    // and many more...

    // or use this to add all main ones at once.
    //await addBasePlugins(viewer);

    // Add more plugins not available in base, like CanvasSnipperPlugin which has helpers to download an image of the canvas.
    //await viewer.addPlugin(CanvasSnipperPlugin);

    // This must be called once after all plugins are added.
    viewer.renderer.refreshPipeline();

    // Import and add a GLB file.
    await manager.addFromPath("scene-black.glb");
    viewer.getPlugin(TonemapPlugin).config.clipBackground = true;

    viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: false });

    if (isMobileorTablet) {
      position.set(-16.7, 1.17, 11.7);
      target.set(0, 1.37, 0);
      props.contentRef.current.className = "mobile-or-tablet";
    }
    window.scrollTo(0, 0);

    let needsUpdate = true;

    const onUpload = () => {
      needsUpdate = true;
      viewer.setDirty();
    };

    viewer.addEventListener("preFrame", () => {
      if (needsUpdate) {
        camera.positionTargetUpdated(true);
        needsUpdate = false;
      }
    });

    memoizedScrollAnimation(position, target, isMobileorTablet, onUpload);
  }, []);

  useEffect(() => {
    setupViewer();
  }, []);

  const handleExit = useCallback(() => {
    canvasContainerRef.current.style.pointerEvents = "none";
    props.contentRef.current.style.opacity = "1";
    viewerRef.scene.activeCamera.setCameraOptions({ controlsEnabled: false });
    setPreviewMode(false);

    gsap.to(positionRef, {
      x: !isMobile ? 1.56 : 9.36,
      y: !isMobile ? 5.0 : 10.95,
      z: !isMobile ? 0.01 : 0.0,
      scrollTrigger: {
        trigger: ".display-section",
        start: "top bottom",
        end: "top top",
        scrub: 2,
        immediateRender: false,
      },
      onUpdate: () => {
        viewerRef.setDirty();
        cameraRef.positionTargetUpdated(true);
      },
    });

    gsap.to(targetRef, {
      x: !isMobile ? -0.55 : -1.62,
      y: !isMobile ? 0.32 : 0.02,
      z: !isMobile ? 0.0 : -0.06,
      scrollTrigger: {
        trigger: ".display-section",
        start: "top bottom",
        end: "top top",
        scrub: 2,
        immediateRender: false,
      },
    });
  }, [canvasContainerRef, viewerRef, positionRef, cameraRef, targetRef]);
  return (
    <div ref={canvasContainerRef} id="webgi-canvas-container">
      <canvas id="webgi-canvas" ref={canvasRef} />
      {previewMode && (
        <button onClick={handleExit} className="button">
          Exit
        </button>
      )}
    </div>
  );
});

export default WebgiViewer;

// const WebgiViewer1 = () => {
//   const canvasRef = useRef(null);

//   const memoizedScrollAnimation = useCallback((position, target, onUpdate) => {
//     if (position && target && onUpdate) {
//       scrollAnimation(position, target, onUpdate);
//     }
//   }, []);

//   const setupViewer = useCallback(async () => {
//     // Initialize the viewer
//     const viewer = new ViewerApp({
//       canvas: canvasRef.current,
//     });

//     // Add some plugins
//     const manager = await viewer.addPlugin(AssetManagerPlugin);

//     const camera = viewer.scene.activeCamera;
//     const position = camera.position;
//     const target = camera.target;

//     // Add a popup(in HTML) with download progress when any asset is downloading.
//     // await viewer.addPlugin(AssetManagerBasicPopupPlugin);

//     // Add plugins individually.
//     await viewer.addPlugin(GBufferPlugin);
//     await viewer.addPlugin(new ProgressivePlugin(32));
//     await viewer.addPlugin(new TonemapPlugin(true));
//     await viewer.addPlugin(GammaCorrectionPlugin);
//     await viewer.addPlugin(SSRPlugin);
//     await viewer.addPlugin(SSAOPlugin);
//     // await viewer.addPlugin(DiamondPlugin)
//     // await viewer.addPlugin(FrameFadePlugin)
//     // await viewer.addPlugin(GLTFAnimationPlugin)
//     // await viewer.addPlugin(GroundPlugin)
//     await viewer.addPlugin(BloomPlugin);
//     // await viewer.addPlugin(TemporalAAPlugin)
//     // await viewer.addPlugin(AnisotropyPlugin)
//     // and many more...

//     // or use this to add all main ones at once.
//     //await addBasePlugins(viewer);

//     // Add more plugins not available in base, like CanvasSnipperPlugin which has helpers to download an image of the canvas.
//     //await viewer.addPlugin(CanvasSnipperPlugin);

//     // This must be called once after all plugins are added.
//     viewer.renderer.refreshPipeline();

//     // Import and add a GLB file.
//     await manager.addFromPath("scene-black.glb");
//     viewer.getPlugin(TonemapPlugin).config.clipBackground = true;

//     viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: false });

//     window.scrollTo(0, 0);

//     let needsUpdate = true;

//     const onUpload = () => {
//       needsUpdate = true;
//       viewer.setDirty();
//     };

//     viewer.addEventListener("preFrame", () => {
//       if (needsUpdate) {
//         camera.positionTargetUpdated(true);
//         needsUpdate = false;
//       }
//     });

//     memoizedScrollAnimation(position, target, onUpload);
//   }, []);

//   useEffect(() => {
//     setupViewer();
//   }, []);

//   return (
//     <div id="webgi-canvas-container">
//       <canvas id="webgi-canvas" ref={canvasRef} />
//     </div>
//   );
// };
