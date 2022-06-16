#!/bin/zsh

# このファイルが配置されているディレクトリに移動した上で実行する（実行ディレクトリに左右されたくないため）
cd "$(dirname "$0")"

cd s3rver

# 再作成はファイル数が多くSSDへの負担が大きいので、必要な場合のみ実行する
# rm -rf mount
# mkdir mount
npx s3rver -d ./mount

