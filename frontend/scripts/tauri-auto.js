#!/usr/bin/env node
/**
 * Auto-detect GPU and run Tauri with appropriate features
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Get the command (dev or build)
const command = process.argv[2];
if (!command || !['dev', 'build'].includes(command)) {
  console.error('Usage: node tauri-auto.js [dev|build]');
  process.exit(1);
}

// Detect GPU feature
let feature = '';

// Check for environment variable override first
if (process.env.TAURI_GPU_FEATURE) {
  feature = process.env.TAURI_GPU_FEATURE;
  console.log(`🔧 Using forced GPU feature from environment: ${feature}`);
} else {
  try {
    const result = execSync('node scripts/auto-detect-gpu.js', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'inherit']
    });
    feature = result.trim();
  } catch (err) {
    // If detection fails, continue with no features
  }
}

console.log(''); // Empty line for spacing

// Platform-specific environment variables
const platform = os.platform();
const env = { ...process.env };

// Privacy: strip the builder's absolute home path out of embedded panic/debug
// strings so the shipped binary never leaks the build machine's username.
// Uses the current builder's $HOME (no hardcoded path) — safe in a public repo
// and correct for any contributor.
{
  const home = os.homedir();
  const rustRemap = `--remap-path-prefix=${home}=/build`;
  env.RUSTFLAGS = env.RUSTFLAGS ? `${env.RUSTFLAGS} ${rustRemap}` : rustRemap;
  // C/C++/ObjC sources (whisper.cpp/ggml via whisper-rs-sys) embed __FILE__
  // paths the Rust flag can't touch — remap those for the C toolchain too.
  const cRemap = `-ffile-prefix-map=${home}=/build`;
  for (const v of ['CFLAGS', 'CXXFLAGS', 'OBJCFLAGS', 'OBJCXXFLAGS',
                   'CMAKE_C_FLAGS', 'CMAKE_CXX_FLAGS']) {
    env[v] = env[v] ? `${env[v]} ${cRemap}` : cRemap;
  }
}

// Updater signing: Tauri's bundler reads the private KEY CONTENT from
// TAURI_SIGNING_PRIVATE_KEY (not the _PATH form). If only a path is provided,
// load the file into the content var so `pnpm tauri build` signs the update
// artifacts automatically.
if (!env.TAURI_SIGNING_PRIVATE_KEY && env.TAURI_SIGNING_PRIVATE_KEY_PATH) {
  try {
    env.TAURI_SIGNING_PRIVATE_KEY = fs.readFileSync(
      env.TAURI_SIGNING_PRIVATE_KEY_PATH, 'utf8'
    ).trim();
  } catch (e) {
    console.warn(`⚠ could not read TAURI_SIGNING_PRIVATE_KEY_PATH: ${e.message}`);
  }
}

if (platform === 'linux' && feature === 'cuda') {
  console.log('🐧 Linux/CUDA detected: Setting CMAKE flags for NVIDIA GPU');
  env.CMAKE_CUDA_ARCHITECTURES = '75';
  env.CMAKE_CUDA_STANDARD = '17';
  env.CMAKE_POSITION_INDEPENDENT_CODE = 'ON';
}

// Build the tauri command
let tauriCmd = `tauri ${command}`;
if (feature && feature !== 'none') {
  tauriCmd += ` -- --features ${feature}`;
  console.log(`🚀 Running: tauri ${command} with features: ${feature}`);
} else {
  console.log(`🚀 Running: tauri ${command} (CPU-only mode)`);
}
console.log('');

// Execute the command
try {
  execSync(tauriCmd, { stdio: 'inherit', env });
} catch (err) {
  process.exit(err.status || 1);
}
