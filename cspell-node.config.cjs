const fs = require("fs");
const path = require("path");

/**
 * `package.json`を検索する
 * @param {string} from - 検索を開始するディレクトリ
 * @returns {string} - package.jsonへのパス
 */
function findNearestPackageJson(from) {
  from = path.resolve(from);
  const parent = path.dirname(from);
  if (!from || parent === from) {
    return;
  }

  const pkg = path.join(from, "package.json");
  if (fs.existsSync(pkg)) {
    return pkg;
  }
  return findNearestPackageJson(parent);
}

/**
 * 最も近い package.json を読み込む
 * @param {string} cwd
 * @returns
 */
function loadPackage(cwd) {
  const pkgFile = findNearestPackageJson(cwd);
  console.log("found: %o", pkgFile);
  if (!pkgFile) return;
  return JSON.parse(fs.readFileSync(pkgFile, "utf-8"));
}

function determinePackageNamesAndMethods(cwd = process.cwd()) {
  const pkg = loadPackage(cwd) || {};
  const packageNames = Object.keys(pkg.dependencies || {}).concat(
    Object.keys(pkg.devDependencies || {}),
  );
  const setOfWords = new Set(
    packageNames.flatMap((name) => name.replace(/[@]/g, "").split("/")),
  );
  const words = [...setOfWords];
  return { words };
}

module.exports = {
  words: determinePackageNamesAndMethods().words,
};
