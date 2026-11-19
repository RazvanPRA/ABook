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
    // zod 4's ESM build uses `export * as ns from`, which the RN preset does not transform
    '@babel/plugin-transform-export-namespace-from',
    // Reanimated 4: the worklets plugin must stay last
    'react-native-worklets/plugin',
  ],
};
