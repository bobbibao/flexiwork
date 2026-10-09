/* eslint-disable */
module.exports = {
  root: true,
  env: {
    node: true
  },
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: 2020,
    sourceType: "module"
  },
  extends: ["plugin:vue/essential"],
  ignorePatterns: ["**/*.js"],
  rules: process.env.DOCKER_BUILD
    ? {}
    : {
        "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
        "max-len": ["error", { code: 360 }],
        "node/no-unsupported-features/es-syntax": "off"
      }
};
