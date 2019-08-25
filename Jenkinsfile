pipeline {
  agent any
  //常量参数，初始确定后一般不需更改
  environment {
    // 项目名
    DOCKER_PROJECT_NAME = 'SHOP'
  }

  //pipeline运行结果通知给触发者
  post{
    success{
      script {
        // 打Tag需要成功通知
        if(env.TAG_NAME) {
          emailext (
            body: """
                <p>${env.TAG_NAME}版本部署成功</p>
            """,
            to: "${env.DEPLOY_WEB_EMAIL_LIST}",
            subject: "${env.JOB_NAME}-${env.BUILD_NUMBER}-${env.TAG_NAME}版本部署成功",
            attachLog: true
          )
        }
      }
    }
    failure{
      script { 
        // 所有分支出错都需要通知
        emailext (
          body: """
              <p>${env.BRANCH_NAME}分支构建失败</p>
          """,
          to: "${env.DEPLOY_WEB_EMAIL_LIST}",
          subject: "${env.JOB_NAME}-${env.BUILD_NUMBER}-${env.BRANCH_NAME}分支构建失败",
          attachLog: true
        )
      }
    }
    unstable{
      script { 
        // 所有分支不稳定都需要通知
        emailext (
          body: """
              <p>${env.BRANCH_NAME}分支构建失败</p>
          """,
          to: "${env.DEPLOY_WEB_EMAIL_LIST}",
          subject: "${env.JOB_NAME}-${env.BUILD_NUMBER}-${env.BRANCH_NAME}分支构建失败",
          attachLog: true
        )
      }
    }
  }

  //pipeline的各个阶段场景
  stages {

    stage('Deploy'){
      steps{
        echo "开始部署。。。"
        script{
          env.needDeploy = "No"
          env.deployChecked = 0
          env.deployHost = '';
          if (env.TAG_NAME) {
            // 通知询问构建
            def jobInfo=env.JOB_NAME.split("/")
            emailext (
              body: """
              <p>请开发组长用个人账户登录Jenkins Pipeline页面，同意${env.TAG_NAME}版本部署</p>
              <p>Pipeline页面： <a href='${env.JENKINS_URL}blue/organizations/jenkins/${jobInfo[0]}/detail/${jobInfo[1]}/${env.BUILD_NUMBER}/pipeline'>${env.JOB_NAME}(pipeline page)</a></p>
              """,
              to: "${env.LEADER_WEB_USER_EMAIL}",
              subject: "${env.JOB_NAME}-${env.BUILD_NUMBER}-请开发组长同意${env.TAG_NAME}版本部署",
              attachLog: true
            )

            // 询问构建
            try {
              timeout(time: 5, unit: 'MINUTES') {
                env.Master_Confirm = input(
                  message: '是否开始部署正式环境？',
                  ok: "确定",
                  submitter: "${env.LEADER_WEB_USER}",
                  parameters: [
                    choice(choices: "Yes\nNo\n", description: '开发组长确认是否部署，不同意请选择No!', name: 'Master_Confirm')
                  ],
                )
              }
            } catch (err){
              echo err.toString()
              env.Master_Confirm='No'
            }
            

            // 同意部署
            if (!"${env.Master_Confirm}".contains("Yes")) {
              //如果组长不通过，退回开发继续开发部署
              emailext (
                body: """
                <p>开发组长不通过正式环境部署，请相关开发重新开发部署和自测<p>
                <p>需要重新部署在Jenkins Pipeline视图继续执行步骤 <a href='${env.JENKINS_URL}blue/organizations/jenkins/${jobInfo[0]}/detail/${jobInfo[1]}/${env.BUILD_NUMBER}/pipeline'>${env.JOB_NAME}${env.JOB_NAME} (pipeline)</a> ！！！</p>
                """,
                to: "${env.DEPLOY_WEB_EMAIL_LIST}",
                subject: "${env.JOB_NAME}-${env.BUILD_NUMBER}-开发组长不通过开发完成，请相关开发重新开发部署和自测",
                attachLog: true
              )
              echo "组长已拒绝部署！${env.Master_Confirm}"
              throw new RuntimeException()
              false
            } else {
              env.needDeploy = "Yes"
              env.deployChecked = 1
              env.deployHost = "http://service.chedianai.com/callback"
            }

          } else if (env.BRANCH_NAME == 'build/dev') {
            env.needDeploy = "Yes"
            env.deployChecked = 0
            env.deployHost = "http://service.dev.chedianai.com/callback"
          } else if (env.BRANCH_NAME == 'build/test') {
            env.needDeploy = "Yes"
            env.deployChecked = 0
            env.deployHost = "http://service.test.chedianai.com/callback"
          } else {
            false
          }

          // 开始部署
          if ("${env.needDeploy}".contains("Yes")) {
            echo "部署服务器中。。。"
            env.requestUrl = "${env.deployHost}/mini_program_code?version_type=${env.DOCKER_PROJECT_NAME}&checked=${env.deployChecked}"
            echo "${env.requestUrl}"
            sh '''
              #!/bin/bash
              RESULT=$(curl -X GET "${requestUrl}&time=$(date +%s)" -H "Accept:application/json" -H "Content-Type:application/json" -sL)
              echo $RESULT

              if [ "$RESULT" != 'success' ]
              then
                echo "出现错误！"
                exit -1
              fi
            '''
            echo "部署服务器完成。。。"
          } else {
            false
          }
        }
        echo "部署结束。。。"
      }
    }
  }
}
