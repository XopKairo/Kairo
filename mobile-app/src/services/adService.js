import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { getAppSettings } from './api';

let rewardedAd = null;

export const initRewardedAd = async (onAdDismissed, onRewardEarned) => {
  try {
    const settings = await getAppSettings();
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
        console.log('User earned reward of ', reward);
        if (onRewardEarned) onRewardEarned(settings.rewardPerAd || 5);
      },
    );

    const unsubscribeClosed = rewardedAd.addAdEventListener(
      RewardedAdEventType.CLOSED,
      () => {
        console.log('Ad Closed');
        if (onAdDismissed) onAdDismissed();
        // Load the next ad
        rewardedAd.load();
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
  }
};

export const showRewardedAd = () => {
  if (rewardedAd && rewardedAd.loaded) {
    rewardedAd.show();
  } else {
    console.log('Ad not loaded yet');
    if (rewardedAd) rewardedAd.load();
  }
};
