# Upload to Qiniu Cloud Action

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Upload%20to%20Qiniu-blue)](https://github.com/marketplace/actions/upload-to-qiniu-cloud)

## 简介

这是一个用于将静态文件自动上传到七牛云存储（Qiniu Cloud Storage）的 GitHub Action。  
适合静态网站、博客等项目在 CI/CD 流程中自动部署资源到七牛云，实现持续集成和自动化发布。

## 功能特点

- 支持递归上传指定目录下所有文件  
- 保持目录结构，上传到七牛云对应路径  
- 支持配置七牛云 Access Key、Secret Key、空间名和区域  
- 简单易用，方便集成到任何 GitHub Actions 工作流中  

## 使用方法

在你的 GitHub 仓库中，创建或修改 `.github/workflows/deploy.yml`，示例：

```
name: Deploy to Qiniu

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Upload to Qiniu
        uses: your-github-id/upload-to-qiniu-action@v1
        with:
          access_key: ${{ secrets.QINIU_ACCESS_KEY }}
          secret_key: ${{ secrets.QINIU_SECRET_KEY }}
          bucket: your-bucket-name
          region: z0
          local_dir: dist
```

> **注意**  
> - 请将 `your-github-id/upload-to-qiniu-action@v1` 替换为你发布的仓库地址和版本标签。  
> - 七牛云密钥建议通过 GitHub Secrets 管理，避免明文暴露。  
> - `local_dir` 是你本地构建好的静态文件目录，默认是 `dist`。

## 输入参数

| 参数名      | 是否必填 | 默认值 | 说明                         |
| ----------- | -------- | ------ | ---------------------------- |
| `access_key`| 是       | 无     | 七牛云 Access Key            |
| `secret_key`| 是       | 无     | 七牛云 Secret Key            |
| `bucket`    | 是       | 无     | 七牛云存储空间名称           |
| `region`    | 是       | `z0`   | 七牛云区域，支持 `z0`、`z1`、`z2`、`na0` |
| `local_dir` | 是       | `dist` | 本地待上传目录               |

## 目录结构

```
.
├── action.yml          # Action 配置文件
├── index.js            # 主执行脚本
├── package.json        # 依赖声明
├── README.md           # 使用说明
└── node_modules/       # 依赖包（可选）
```

## 开发与贡献

欢迎提交 Issue 和 Pull Request，一起完善此 Action。

## 许可证

MIT License

---

如果你觉得本项目对你有帮助，欢迎给个 Star ⭐️ 支持！
