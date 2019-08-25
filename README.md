# 写在开发之前
终于下定了决心，写一篇关于如何使用的教程

# 首先确保安装了快速、可靠、安全的依赖管理工具'yarn',没有则可以用以下命令安装
npm install -g yarn

# 安装依赖
yarn install

# 启动 dev 服务，并编译打包测试环境 生成 ./dist 目录
yarn start

# 打包正式环境 生成 ./build 目录
yarn build


# 新建文件
1. yarn create-page
2. 输入页面名称？  譬如：customer  or  customer/customerList
3. 是否需要配置文件(.json)？ Y/N