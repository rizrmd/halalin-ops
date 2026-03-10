import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  typescript: true,
  ignores: [
    '.factory/**',
    'archive/**',
    'app/routeTree.gen.ts',
  ],
  rules: {
    'no-alert': 'off',
    'react-refresh/only-export-components': 'off',
    'style/multiline-ternary': 'off',
    'ts/no-use-before-define': 'off',
  },
})
