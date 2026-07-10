const appJson = require('./app.json');

/** Fiziksel cihazda localhost telefonu işaret eder — EXPO_PUBLIC_API_URL ile PC IP'si verin. */
module.exports = () => ({
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ||
      appJson.expo.extra?.apiUrl ||
      'http://localhost:3001/api',
  },
  android: {
    ...appJson.expo.android,
    usesCleartextTraffic: true,
  },
});
