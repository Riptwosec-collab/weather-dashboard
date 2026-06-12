/** @type {import('semantic-release').GlobalConfig} */
export default {
  branches: [
    'main',
    { name: 'beta', prerelease: true },
    { name: 'develop', prerelease: 'alpha' },
  ],
  plugins: [
    // Analyze commits to determine release type
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits',
      releaseRules: [
        { breaking: true,  release: 'major' },
        { type: 'feat',    release: 'minor' },
        { type: 'fix',     release: 'patch' },
        { type: 'perf',    release: 'patch' },
        { type: 'refactor', release: 'patch' },
        { type: 'docs',    release: false   },
        { type: 'chore',   release: false   },
        { type: 'test',    release: false   },
        { type: 'ci',      release: false   },
      ],
    }],

    // Generate release notes for GitHub
    ['@semantic-release/release-notes-generator', {
      preset: 'conventionalcommits',
      presetConfig: {
        types: [
          { type: 'feat',     section: '✨ Features'           },
          { type: 'fix',      section: '🐛 Bug Fixes'          },
          { type: 'perf',     section: '⚡ Performance'         },
          { type: 'refactor', section: '♻️  Refactors'          },
          { type: 'docs',     section: '📚 Documentation', hidden: false },
          { type: 'chore',    section: '🔧 Maintenance',  hidden: true  },
          { type: 'test',     section: '✅ Tests',         hidden: true  },
        ],
      },
    }],

    // Update CHANGELOG.md
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md',
      changelogTitle: '# Weather Dashboard Changelog\n\nAll notable changes are documented here.\nFormat based on [Keep a Changelog](https://keepachangelog.com/).',
    }],

    // Bump version in package.json
    ['@semantic-release/npm', { npmPublish: false }],

    // Commit updated CHANGELOG.md + package.json back to repo
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    }],

    // Create GitHub release with notes
    '@semantic-release/github',
  ],
};
