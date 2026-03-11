import mobileAds, { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import api from './api';

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy';

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'gaming'],
});

export const initRewardedAd = (onEarnReward) => {
  const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    // Ad loaded
  });

  const unsubscribeEarned = rewarded.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    async (reward) => {
      try {
        // SECURE SYNC: Notify backend to add coins after ad completion
        const response = await api.post('wallet/ad-reward');
        if (response.data.success) {
          onEarnReward(response.data.newBalance);
        }
      } catch (error) {
        console.error('Failed to sync ad reward:', error.message);
      }
    },
  );

  rewarded.load();

  return () => {
    unsubscribeLoaded();
    unsubscribeEarned();
  };
};

export const showRewardedAd = () => {
  if (rewarded.loaded) {
    rewarded.show();
  } else {
    rewarded.load();
  }
};
