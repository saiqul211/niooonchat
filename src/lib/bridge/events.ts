/**
 * Dual-Platform Event Bus for Web ↔ Android Communication
 */

export type NativeEventName =
  | 'native:networkChanged'
  | 'native:lifecycle'
  | 'native:downloadCompleted'
  | 'native:deepLink';

export interface NetworkChangedDetail {
  isConnected: boolean;
}

export interface LifecycleDetail {
  state: 'resumed' | 'paused';
}

export const subscribeToNativeEvent = <T>(
  eventName: NativeEventName,
  callback: (detail: T) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<T>;
    callback(customEvent.detail);
  };

  window.addEventListener(eventName, handler);
  return () => {
    window.removeEventListener(eventName, handler);
  };
};
