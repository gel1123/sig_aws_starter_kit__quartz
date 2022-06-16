#!/bin/zsh

# このファイルが配置されているディレクトリに移動した上で実行する（実行ディレクトリに左右されたくないため）
cd "$(dirname "$0")"

echo ---- start DynamoDB Local ----
# https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/DynamoDBLocal.UsageNotes.html

# 永続モードならこちら
# java -Djava.library.path=./DynamoDB_Local/DynamoDBLocal_lib \
#     -jar ./DynamoDB_Local/DynamoDBLocal.jar  \
#     -dbPath ./DynamoDB_Local/localData

# インメモリモードならこちら
java -Djava.library.path=./DynamoDB_Local/DynamoDBLocal_lib \
     -jar ./DynamoDB_Local/DynamoDBLocal.jar  \
     -inMemory

