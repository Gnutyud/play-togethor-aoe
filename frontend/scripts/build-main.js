const esbuild = require('esbuild');

// Bundle both main.ts and preload.ts into separate files
// These will be placed at dist/main/main/main.js and dist/main/main/preload.js
// matching the original tsc output structure expected by package.json "main" field

const sharedConfig = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: [
    // electron is provided by Electron runtime itself - MUST be external
    'electron',
    // fsevents is mac-only native module
    'fsevents',
  ],
  sourcemap: false,
  logLevel: 'info',
};

Promise.all([
  // Bundle main process entry point
  esbuild.build({
    ...sharedConfig,
    entryPoints: ['src/main/main.ts'],
    outfile: 'dist/main/main/main.js',
  }),

  // Bundle preload script entry point
  esbuild.build({
    ...sharedConfig,
    entryPoints: ['src/main/preload.ts'],
    outfile: 'dist/main/main/preload.js',
  }),
])
  .then(() => {
    console.log('');
    console.log('✅ Main process bundled successfully!');
    console.log('   → dist/main/main/main.js    (includes: winston, electron-store, zustand, axios, ...)');
    console.log('   → dist/main/main/preload.js');
    console.log('   All dependencies are inlined — no external node_modules required at runtime.');
    console.log('');
  })
  .catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
  });
