module.exports = {
  extends: ['next/core-web-api', 'plugin:react/recommended'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-hooks/exhaustive-deps': 'warn', // Downgrade from error to warning
    'jsx-a11y/alt-text': 'warn', // Downgrade from error to warning
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'error' // Keep this as error since it's breaking the build
  }
}; 