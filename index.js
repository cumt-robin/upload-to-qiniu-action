const core = require('@actions/core');
const qiniu = require('qiniu');
const fs = require('fs');
const path = require('path');
const mime = require('mime').default;

function getMimeType(filePath) {
  return mime.getType(filePath) || 'application/octet-stream';
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

async function run() {
  try {
    const accessKey = core.getInput('access_key');
    const secretKey = core.getInput('secret_key');
    const bucket = core.getInput('bucket');
    const region = core.getInput('region');
    const localDir = core.getInput('local_dir');

    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const config = new qiniu.conf.Config();
    config.regionsProvider = qiniu.httpc.Region.fromRegionId(region);

    // 设置上传策略，允许覆盖同名文件
    const options = { 
      scope: bucket,
      insertOnly: 0  // 允许覆盖同名文件
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);

    const formUploader = new qiniu.form_up.FormUploader(config);

    const baseDir = path.resolve(localDir);
    const files = [];
    walkDir(baseDir, filePath => files.push(filePath));

    const sortedFiles = files.filter(filePath => !filePath.includes(path.join(baseDir, 'index.html')));
    const indexHtmlFile = files.find(filePath => filePath.includes(path.join(baseDir, 'index.html')));

    if (indexHtmlFile) {
      sortedFiles.push(indexHtmlFile);
    }

    for (const filePath of sortedFiles) {
      const key = path.relative(baseDir, filePath).replace(/\\/g, '/');
      await new Promise((resolve, reject) => {
        let uToken = uploadToken
        if (['.html', '.xml', '.svg'].some(ext => key.endsWith(ext))) {
          const tempPolicy = new qiniu.rs.PutPolicy({
            scope: `${bucket}:${key}`,
            insertOnly: 0,
          });
          uToken = tempPolicy.uploadToken(mac);
        }
        const putExtra = new qiniu.form_up.PutExtra();
        putExtra.mimeType = getMimeType(filePath);
        formUploader.putFile(uToken, key, filePath, putExtra, (err, body, info) => {
          if (err) return reject(err);
          if (info.statusCode === 200) {
            core.info(`上传成功: ${key}`);
            resolve();
          } else {
            reject(new Error(`上传失败: ${key}, 状态码: ${info.statusCode}`));
          }
        });
      });
    }
    core.info('所有文件上传完成');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
