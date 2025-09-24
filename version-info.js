/**
 * Version management utilities for Trading Dashboard
 * Handles build versioning, release tagging, and deployment tracking
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionManager {
  constructor() {
    this.packagePath = path.join(__dirname, 'package.json');
    this.versionFile = path.join(__dirname, 'version.json');
  }

  /**
   * Get current version from package.json
   */
  getCurrentVersion() {
    const pkg = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    return pkg.version;
  }

  /**
   * Get git commit hash
   */
  getGitCommit() {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get git branch name
   */
  getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Create version information object
   */
  createVersionInfo() {
    const buildTime = new Date().toISOString();
    const version = this.getCurrentVersion();
    const commit = this.getGitCommit();
    const branch = this.getGitBranch();
    const nodeVersion = process.version;

    return {
      version,
      buildTime,
      gitCommit: commit,
      gitBranch: branch,
      nodeVersion,
      buildEnv: process.env.NODE_ENV || 'development',
      platform: process.platform,
      architecture: process.arch
    };
  }

  /**
   * Write version info to file
   */
  writeVersionFile() {
    const versionInfo = this.createVersionInfo();
    fs.writeFileSync(this.versionFile, JSON.stringify(versionInfo, null, 2));
    return versionInfo;
  }

  /**
   * Bump version (patch, minor, or major)
   */
  bumpVersion(type = 'patch') {
    const pkg = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    const [major, minor, patch] = pkg.version.split('.').map(Number);

    let newVersion;
    switch (type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }

    pkg.version = newVersion;
    fs.writeFileSync(this.packagePath, JSON.stringify(pkg, null, 2));
    
    console.log(`Version bumped from ${major}.${minor}.${patch} to ${newVersion}`);
    return newVersion;
  }

  /**
   * Create release tag
   */
  createTag(version) {
    try {
      execSync(`git tag -a v${version} -m "Release version ${version}"`);
      console.log(`Created tag v${version}`);
      return `v${version}`;
    } catch (error) {
      console.error('Failed to create git tag:', error.message);
      return null;
    }
  }
}

// Export for use as module
module.exports = VersionManager;

// CLI usage
if (require.main === module) {
  const vm = new VersionManager();
  const command = process.argv[2];

  switch (command) {
    case 'info':
      console.log(JSON.stringify(vm.createVersionInfo(), null, 2));
      break;
    case 'write':
      const info = vm.writeVersionFile();
      console.log('Version file created:', info);
      break;
    case 'bump':
      const type = process.argv[3] || 'patch';
      vm.bumpVersion(type);
      break;
    case 'tag':
      const version = vm.getCurrentVersion();
      vm.createTag(version);
      break;
    default:
      console.log('Usage: node version-info.js [info|write|bump|tag]');
      console.log('  info  - Display version information');
      console.log('  write - Write version.json file');
      console.log('  bump  - Bump version (patch|minor|major)');
      console.log('  tag   - Create git tag for current version');
  }
}