import mobileAds, { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import api from './api';

const adUnitId = __DEV__ ? TestIds.REWARDED : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || "ca-app-pub-2842532668081504/4662026359");

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'gaming'],
});

export const initRewardedAd = (onEarnReward, onFail) => {
  const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    console.log('Ad Loaded');
  });

  const unsubscribeEarned = rewarded.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    async (reward) => {
      try {
        const response = await api.post('user/wallet/ad-reward');
        if (response.data.success) {
          onEarnReward(response.data.newBalance);
        }
      } catch (error) {
        console.error('Failed to sync ad reward:', error.message);
        if (onFail) onFail();
      }
    },
  );

  // Handle errors
  const unsubscribeClosed = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
    rewarded.load();
    if (onFail) onFail();
  });

  rewarded.load();

  return () => {
    unsubscribeLoaded();
    unsubscribeEarned();
    unsubscribeClosed();
  };
};

export const showRewardedAd = () => {
  if (rewarded.loaded) {
    rewarded.show();
    return true;
  } else {
    rewarded.load();
    return false;
  }
};
