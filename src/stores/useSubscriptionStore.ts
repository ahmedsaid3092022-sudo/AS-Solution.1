import { useSyncExternalStore, useCallback } from 'react';
import { SubscriptionInfo } from '../types';
import { subscriptionService } from '../services/subscriptionService';

interface SubscriptionStoreState {
  info: SubscriptionInfo;
}

let storeState: SubscriptionStoreState = {
  info: subscriptionService.getSubscriptionInfo(),
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return storeState;
}

export function refreshSubscriptionStore() {
  const updated = subscriptionService.getSubscriptionInfo();
  storeState = { info: updated };
  notify();
}

// Single background interval for subscription refresh
if (typeof window !== 'undefined') {
  setInterval(() => {
    const updated = subscriptionService.getSubscriptionInfo();
    if (updated.status !== storeState.info.status || updated.daysRemaining !== storeState.info.daysRemaining) {
      storeState = { info: updated };
      notify();
    }
  }, 10000);
}

export function useSubscriptionStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const subInfo = state.info;

  const refreshSubscription = useCallback(() => {
    refreshSubscriptionStore();
  }, []);

  const activateLicenseKey = useCallback((key: string) => {
    const res = subscriptionService.activateLicenseKey(key);
    refreshSubscriptionStore();
    return res;
  }, []);

  const isLocked = subInfo.status === 'EXPIRED' || subInfo.status === 'TAMPERED' || subInfo.status === 'UNLICENSED';

  return {
    subscriptionInfo: subInfo,
    isLocked,
    refreshSubscription,
    activateLicenseKey,
  };
}

