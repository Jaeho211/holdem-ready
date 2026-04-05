export const APP_NAME = "Holdem Quiz";
export const APP_DESCRIPTION = "라스베가스 라이브 홀덤을 준비하는 사람을 위한 모바일 우선 학습 앱";
export const APP_THEME_COLOR = "#0b3b2e";
export const APP_BACKGROUND_COLOR = "#041711";
export const APP_SITE_URL = process.env.NEXT_PUBLIC_APP_SITE_URL ?? "";
export const APP_SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";
export const APP_SUPPORT_PATH = "/support";
export const APP_PRIVACY_PATH = "/privacy";
export const APP_FEEDBACK_URL = "https://github.com/Jaeho211/holdem-ready/issues";
export const APP_REPOSITORY_URL = "https://github.com/Jaeho211/holdem-ready";
export const APP_ANDROID_PACKAGE_NAME = process.env.ANDROID_PACKAGE_NAME ?? "com.jaeho211.holdemquiz";
export const APP_ANDROID_CERT_FINGERPRINTS = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const getAppMetadataBase = () => {
  if (!APP_SITE_URL) {
    return undefined;
  }

  try {
    return new URL(APP_SITE_URL);
  } catch {
    return undefined;
  }
};
