import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { getAppSettings } from './api';

let rewardedAd = null;

export const initRewardedAd = async (onAdDismissed, onRewardEarned) => {
  try {
    const settings = await getAppSettings().catch(() => ({}));
    // Use test ID if no ID is provided in settings
    const adUnitId = settings.adMobId || TestIds.REWARDED;

    rewardedAd = RewardedAd.createForAdUnitId(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Ad Loaded');
    });

    const unsubscribeEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        const rewardAmount = settings.rewardPerAd || 5;
        if (onRewardEarned) onRewardEarned(rewardAmount);
      },
    );

    const unsubscribeClosed = rewardedAd.addAdEventListener(
      RewardedAdEventType.CLOSED,
      () => {
        if (onAdDismissed) onAdDismissed();
        rewardedAd.load(); // Load next
      },
    );

    rewardedAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
    };
  } catch (error) {
    console.error('Ad Init Error:', error);
    return () => {};
  }
};

export const showRewardedAd = () => {
  if (rewardedAd && rewardedAd.loaded) {
    rewardedAd.show();
  } else {
    if (rewardedAd) rewardedAd.load();
  }
};
