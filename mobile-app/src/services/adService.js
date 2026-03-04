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
    });

    const unsubscribeEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        if (onRewardEarned) onRewardEarned(settings.rewardPerAd || 5);
      },
    );

    const unsubscribeClosed = rewardedAd.addAdEventListener(
      RewardedAdEventType.CLOSED,
      () => {
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
  }
};

export const showRewardedAd = () => {
  if (rewardedAd && rewardedAd.loaded) {
    rewardedAd.show();
  } else {
    if (rewardedAd) rewardedAd.load();
  }
};
