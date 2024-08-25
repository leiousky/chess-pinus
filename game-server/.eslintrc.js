// module.exports = {
//     extends: [],
//     rules: {
//         // 不加分号
//         semi: 'error',
//         // 单引号
//         'quotes': ['error', 'single'],
//         // 允许 any 类型
//         '@typescript-eslint/no-explicit-any': 'off'
//     }
// };
//
// @ts-check

// import eslint from '@eslint/js';
// import tseslint from 'typescript-eslint';
//
// export default tseslint.config(
//     eslint.configs.recommended,
//     ...tseslint.configs.recommended,
// );

/* eslint-env node */
module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    root: true,
    rules: {
        // 不加分号
        semi: ['error', 'never'],
        // 单引号
        quotes: ['error', 'single'],
        // 允许 any 类型
        '@typescript-eslint/no-explicit-any': 'off',
        // 允许未使用变量
        '@typescript-eslint/no-unused-vars': 'warn',
        'no-trailing-spaces': 'error',
    },
    // 忽略 js
    ignorePatterns: ['*.js', 'node_modules/*'],
}
