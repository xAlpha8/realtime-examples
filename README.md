# realtime-examples

To get started, run the following command from the root directory of the project:
```bash
poetry install
```

If you don't have poetry installed, visit [https://python-poetry.org/docs/](https://python-poetry.org/docs/) and follow the instructions there.

# Seting up new frontend

```bash
npm create vite@latest
```

# Setup tailwindcss
```bash
pnpm install -D tailwindcss postcss autoprefixer
```

```bash
npx tailwindcss init
```

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

```css
/* tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```