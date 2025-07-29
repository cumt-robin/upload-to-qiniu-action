const core = require('@actions/core');
const qiniu = require('qiniu');
const fs = require('fs');
const path = require('path');

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
    const putExtra = new qiniu.form_up.PutExtra();

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

    const baseDir = path.resolve(localDir);
    const files = [];
    walkDir(baseDir, filePath => files.push(filePath));

    for (const filePath of files) {
      const key = path.relative(baseDir, filePath).replace(/\\/g, '/');
      await new Promise((resolve, reject) => {
        formUploader.putFile(uploadToken, key, filePath, putExtra, (err, body, info) => {
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
