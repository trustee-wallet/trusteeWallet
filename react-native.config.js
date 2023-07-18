module.exports = {
    project: {
        android: {}
    },
    assets: ['./assets/fonts/'],
    dependencies: {
        'react-native-vector-icons': {
          platforms: {
            ios: null,
          },
        },
        'react-native-video': {
          platforms: {
            android: {
              sourceDir: '../node_modules/react-native-video/android-exoplayer',
            },
          },
        },
      },
}
