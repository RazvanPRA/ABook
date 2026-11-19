module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: { '@': './src' },
      },
    ],
    // Reanimated 4: the worklets plugin must stay last
    'react-native-worklets/plugin',
  ],
};
