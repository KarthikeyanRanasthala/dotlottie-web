/**
 * Copyright 2023 Design Barn Inc.
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import DotLottieNew from './dotlottie-new';
import { DotLottiePlayer, DotLottieCommonPlayer } from '@dotlottie/react-player';
import { DotLottie } from '@lottiefiles/dotlottie-react';
import { Range, getTrackBackground } from 'react-range';
import {
  setActiveAnimationId,
  setAnimations,
  setCurrentFrame,
  setCurrentState,
  setLoadTimeDotLottie,
  setLoadTimeLottieWeb,
  setLoop,
  setMarkers,
  setThemes,
  setTotalFrames,
} from '../store/viewer-slice';
import { FaPlay, FaPause } from 'react-icons/fa';
import { ImLoop } from 'react-icons/im';
import { GiNextButton, GiPreviousButton } from 'react-icons/gi';
import LoadTime from './load-time';

let startTime = performance.now();

export default function Players() {
  const lottieWebRef = useRef<DotLottieCommonPlayer | null>(null);
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const src = useAppSelector((state) => state.viewer.src);
  const backgroundColor = useAppSelector((state) => state.viewer.backgroundColor);
  const speed = useAppSelector((state) => state.viewer.speed);
  const autoplay = useAppSelector((state) => state.viewer.autoplay);
  const loop = useAppSelector((state) => state.viewer.loop);
  const totalFrames = useAppSelector((state) => state.viewer.totalFrames);
  const currentFrame = useAppSelector((state) => state.viewer.currentFrame);
  const currentState = useAppSelector((state) => state.viewer.currentState);
  const mode = useAppSelector((state) => state.viewer.mode);
  const activeAnimationId = useAppSelector((state) => state.viewer.activeAnimationId);
  const activeThemeId = useAppSelector((state) => state.viewer.activeThemeId);
  const isJson = useAppSelector((state) => state.viewer.isJson);
  const loadTime = useAppSelector((state) => state.viewer.loadTime);
  const animations = useAppSelector((state) => state.viewer.animations);
  const segment = useAppSelector((state) => state.viewer.segment);
  const useFrameInterpolation = useAppSelector((state) => state.viewer.useFrameInterpolation);
  const activeMarker = useAppSelector((state) => state.viewer.activeMarker);
  const dispatch = useAppDispatch();

  const onLoad = useCallback(() => {
    dispatch(setTotalFrames(dotLottie?.totalFrames));
    const endTime = performance.now();
    dispatch(setLoadTimeDotLottie(endTime - startTime));
    if (!src.endsWith('.json') && !src.startsWith('data:application/json')) {
      if (!activeAnimationId) {
        dispatch(setActiveAnimationId(dotLottie?.manifest?.animations?.[0]?.id || ''));
      }
      dispatch(setAnimations(dotLottie?.manifest?.animations?.map((item) => item.id) || []));
      dispatch(setThemes(dotLottie?.manifest?.themes || []));
      dispatch(setMarkers(dotLottie?.markers()?.map((marker) => marker.name) || []));
    }
  }, [src, dotLottie, dispatch, activeAnimationId]);

  const onFrame = useCallback(() => {
    dispatch(setCurrentFrame(dotLottie?.currentFrame || 0));
  }, [dispatch, dotLottie]);

  const getNext = useCallback(() => {
    const currentIndex = animations.indexOf(activeAnimationId);
    if (currentIndex === -1) return undefined; // or handle error

    // Use modulus to wrap around
    const nextIndex = (currentIndex + 1) % animations.length;
    return animations[nextIndex];
  }, [animations, activeAnimationId]);

  const getPrevious = useCallback(() => {
    const currentIndex = animations.indexOf(activeAnimationId);
    if (currentIndex === -1) return undefined; // or handle error

    // Use modulus to wrap around. Adding `emotions.length` before subtracting to avoid negative index
    const prevIndex = (currentIndex - 1 + animations.length) % animations.length;
    return animations[prevIndex];
  }, [animations, activeAnimationId]);

  useEffect(() => {
    if (!dotLottie) return;
    dotLottie.addEventListener('load', onLoad);
    dotLottie.addEventListener('frame', onFrame);
    return () => {
      dotLottie.removeEventListener('load', onLoad);
      dotLottie.removeEventListener('frame', onFrame);
    };
  }, [onLoad, dotLottie, onFrame]);

  useEffect(() => {
    if (!dotLottie) return;
    if (segment[0] && segment[1]) {
      dotLottie.setSegment(segment[0], segment[1]);
    }
  }, [segment, dotLottie]);

  useEffect(() => {
    dotLottie?.setMarker(activeMarker);
  }, [activeMarker]);

  useEffect(() => {
    if (!dotLottie) return;
    dotLottie.setUseFrameInterpolation(useFrameInterpolation);
  }, [dotLottie, useFrameInterpolation]);

  const addEventListeners = useCallback(
    (player: DotLottie) => {
      player.addEventListener('complete', () => {
        dispatch(setCurrentState('stopped'));
      });
      player.addEventListener('stop', () => {
        dispatch(setCurrentState('stopped'));
      });
      player.addEventListener('play', () => {
        dispatch(setCurrentState('playing'));
      });
      player.addEventListener('pause', () => {
        dispatch(setCurrentState('paused'));
      });
    },
    [dispatch],
  );

  useEffect(() => {
    if (!dotLottie) return;
    startTime = performance.now();
    dotLottie?.loadAnimation(activeAnimationId);
  }, [activeAnimationId, dotLottie]);

  useEffect(() => {
    if (!dotLottie) return;
    dotLottie?.loadTheme(activeThemeId);
  }, [activeThemeId, dotLottie]);

  useEffect(() => {
    if (!dotLottie) return;
    dispatch(setAnimations(dotLottie?.manifest?.animations?.map((item) => item.id) || []));
    dispatch(setThemes(dotLottie?.manifest?.themes || []));
  }, [dotLottie, dispatch]);

  useEffect(() => {
    startTime = performance.now();
  }, [src, dotLottie]);

  return (
    <>
      <div className="h-full flex-grow flex justify-between items-center flex-col gap-4">
        <div className="flex justify-center h-full">
          <div className="flex flex-col dotlottie-player">
            <LoadTime
              version="v0.20.0"
              rendererVersion="thorvg@0.13.0"
              className="mb-4"
              title="dotLottie Web"
              loadTime={parseFloat(loadTime.dotLottie.toFixed(2))}
            />
            <div className="flex justify-center items-center p-4 flex-grow">
              <div style={{ width: '350px', height: '350px' }}>
                <DotLottieNew
                  backgroundColor={backgroundColor}
                  width={350}
                  height={350}
                  autoplay={autoplay}
                  useFrameInterpolation={true}
                  loop={loop}
                  mode={mode}
                  speed={speed}
                  dotLottieRefCallback={(ref) => {
                    if (ref) {
                      addEventListeners(ref);
                      setDotLottie(ref);
                    }
                  }}
                  src={src}
                />
              </div>
            </div>
          </div>
          {isJson ? (
            <div className="flex flex-col lottie-web">
              <LoadTime
                version="v5.12.2"
                rendererVersion="lottie-web@5.12.2"
                className="mb-4"
                title="Lottie Web"
                loadTime={parseFloat(loadTime.lottieWeb.toFixed(2))}
              />
              <div className="flex justify-center items-center p-4 flex-grow">
                <div style={{ width: '350px', height: '350px' }}>
                  <DotLottiePlayer
                    lottieRef={(ref) => {
                      lottieWebRef.current = ref;
                    }}
                    background={backgroundColor}
                    autoplay={autoplay}
                    loop={loop}
                    speed={speed}
                    onEvent={(event) => {
                      if (event === 'ready') {
                        const endTime = performance.now();
                        dispatch(setLoadTimeLottieWeb(endTime - startTime));
                      }
                    }}
                    src={src}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-4 w-full max-w-[720px]">
          {animations.length > 1 ? (
            <button
              onClick={() => {
                const next = getPrevious();
                if (next) {
                  dispatch(setActiveAnimationId(next));
                }
              }}
            >
              <GiPreviousButton />
            </button>
          ) : null}
          {currentState !== 'playing' ? (
            <button
              onClick={() => {
                dotLottie?.play();
                lottieWebRef.current?.play();
              }}
            >
              <FaPlay />
            </button>
          ) : (
            <button
              onClick={() => {
                dotLottie?.pause();
                lottieWebRef.current?.pause();
              }}
            >
              <FaPause />
            </button>
          )}
          {animations.length > 1 ? (
            <button
              onClick={() => {
                const next = getNext();
                if (next) {
                  dispatch(setActiveAnimationId(next));
                }
              }}
            >
              <GiNextButton />
            </button>
          ) : null}
          <Range
            min={0}
            max={totalFrames || 1}
            values={[currentFrame]}
            onChange={(values) => {
              dotLottie?.setFrame(values[0]);
              lottieWebRef.current?.seek(values[0]);
            }}
            renderTrack={({ props, children }) => (
              <div
                onMouseDown={(event) => {
                  dotLottie?.pause();
                  lottieWebRef.current?.pause();

                  props.onMouseDown(event);
                }}
                onTouchStart={(event) => {
                  dotLottie?.pause();
                  lottieWebRef.current?.pause();

                  props.onTouchStart(event);
                }}
                className="flex-grow w-full flex h-[20px]"
                style={{
                  ...props.style,
                }}
              >
                <div
                  ref={props.ref}
                  className="self-center w-full h-[6px] bg-strong rounded-lg"
                  style={{
                    background: getTrackBackground({
                      values: [currentFrame],
                      colors: ['#80cec8', '#ccc'],
                      min: 0,
                      max: totalFrames,
                    }),
                  }}
                >
                  {children}
                </div>
              </div>
            )}
            renderThumb={({ props }) => (
              <div
                {...props}
                style={{
                  ...props.style,
                  height: '20px',
                  width: '20px',
                  backgroundColor: '#019D91',
                  borderRadius: '50%',
                }}
              />
            )}
          />

          <span className="p-2 text-center flex items-center justify-center bg-white rounded-lg text-sm">
            <span className="w-min text-right pr-1 bg-transparent flex relative">
              <span className="invisible">{totalFrames.toFixed(2)}</span>
              <span className="absolute self-center">{currentFrame.toFixed(2)}</span>
            </span>
            <span className="text-xs text-secondary">of</span>
            <span className="w-max pl-1 bg-transparent">{totalFrames}</span>
          </span>
          <button className="cursor-pointer" onClick={() => dispatch(setLoop(!loop))}>
            <ImLoop className={`${!loop ? 'text-gray-500' : ''}`} />
          </button>
        </div>
      </div>
    </>
  );
}
