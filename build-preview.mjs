import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('./', import.meta.url));
const lab = fileURLToPath(new URL('../oxygen-lab-3d/', import.meta.url));
const outputArg = process.argv[2];
if (!outputArg) throw new Error('Usage: node build-preview.mjs <new output directory>');
const output = resolve(outputArg);
const ref = '4b5c67d0aa65113d78ac34f8db82a918fdf7bdb2';
const git = args => execFileSync('git', args, { cwd: lab, maxBuffer: 24 * 1024 * 1024 });
const read = path => git(['show', `${ref}:${path}`]);
const configPath = 'experiments/current-voltage/experiment.json';
const config = JSON.parse(read(configPath));
const catalogPath = 'assets/catalog.json';
const catalog = JSON.parse(read(catalogPath));

const required = new Set([...config.instruments, ...config.sandboxInstruments].map(({ assetId, assetVersion }) => `${assetId}@${assetVersion}`));
const assets = catalog.assets.filter(({id,version}) => required.has(`${id}@${version}`)).map(({source,provenance,...web}) => web);
if (assets.length !== required.size) throw new Error('An asset is missing from the public snapshot.');

const paths = git(['ls-tree', '-r', '--name-only', ref, '--', 'platform', 'vendor']).toString().trim().split(/\r?\n/);
const files = ['index.html', 'styles.css', 'lab.js', 'favicon.svg', configPath,
  ...paths.filter(path => /^platform\/[\w-]+\.(?:css|html|js|json)$/.test(path) || /^vendor\/[\w./-]+\.(?:js|txt)$/.test(path)),
  ...assets.flatMap(asset => [asset.model, asset.preview]),
];

mkdirSync(output);
function save(path, data) {
  const file = join(output, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
}
for (const path of ['index.html', 'classroom.js', 'classroom.css', 'scene.js']) copyFileSync(join(source, path), join(output, path));
for (const path of new Set(files)) save(`lab/${path}`, read(path));
save(`lab/${catalogPath}`, `${JSON.stringify({ schemaVersion: 1, assets }, null, 2)}\n`);
save('.nojekyll', '');
save('README.md', `# 开放实验室 · 试玩原型\n\n第一人称 3D 教室。左边是电学自由台，右边是制氧实验。\n\n手机：左侧摇杆移动，右侧滑动转头。电脑：WASD 移动、鼠标转头。靠近后点击桌面进入实验。\n\n实验运行文件来自 [已公开的电学快照](https://github.com/yulong3327-dotcom/oxygen-lab-3d/tree/${ref})。\n`);
console.log(`Built static preview with ${assets.length} public instrument assets: ${output}`);
