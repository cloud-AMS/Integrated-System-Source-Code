module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: [
      ['module-resolver', { alias: { '@ams/core': '../packages/ams-core/src/index.ts' } }],
      'react-native-worklets/plugin'
    ]
  };
};