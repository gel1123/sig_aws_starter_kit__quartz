#!/bin/zsh

function ask_yes_no {
  while true; do
    echo -n "$* [y/n]: "
    read ANS
    case $ANS in
      [Yy]*)
        return 0
        ;;  
      [Nn]*)
        return 1
        ;;
      *)
        echo "yまたはnを入力してください"
        ;;
    esac
  done
}

# このファイルが配置されているディレクトリに移動した上で実行する（実行ディレクトリに左右されたくないため）
cd "$(dirname "$0")"

if ask_yes_no "これは Quartz をCDKでデプロイするためのビルドスクリプトです。\n行うのはビルドまでで、デプロイはその後 cdk deploy コマンドより実行してください。\nビルドしますか？"; then
  # ここに「Yes」の時の処理を書く
  echo "ビルドをはじめます"

  # build nuxt app
  cd ./nuxt3
  cp .dev.env .env
  yarn build
  cp .local.env .env
  cd ../
  
  # cd CDK Project Dir
  cd ./cdk
  
  # clean
  rm -f nuxt3.output/nitro.json
  rm -rf nuxt3.output/public
  rm -rf nuxt3.output/server/chunks
  rm -rf nuxt3.output/server/node_modules
  rm -f nuxt3.output/server/index.mjs
  # cp output
  \cp -rf ../nuxt3/.output/* nuxt3.output
  
  # build && deploy
  npm run build && echo "ビルドが完了しました"
else
  # ここに「No」の時の処理を書く
  echo "スクリプトを中止しました"
fi

