

### 前提
* node: v16.13.1

package.json
```
{
  "name": "cdk",
  "version": "0.1.0",
  "bin": {
    "cdk": "bin/cdk.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/jest": "^26.0.10",
    "@types/node": "10.17.27",
    "jest": "^26.4.2",
    "ts-jest": "^26.2.0",
    "aws-cdk": "2.3.0",
    "ts-node": "^9.0.0",
    "typescript": "~3.9.7"
  },
  "dependencies": {
    "aws-cdk-lib": "2.3.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.16"
  }
}
```

こんなエラーが生じたら

```
$ npm run build

> cdk@0.1.0 build
> tsc

node_modules/@types/prettier/index.d.ts:41:54 - error TS2315: Type 'IsTuple' is not generic.

41 type IndexProperties<T extends { length: number }> = IsTuple<T> extends true
                                                        ~~~~~~~~~~

node_modules/@types/prettier/index.d.ts:53:6 - error TS2456: Type alias 'IsTuple' circularly references itself.

53 type IsTuple<T> = T extends [] ? true : T extends [infer First, ...infer Remain] ? IsTuple<Remain> : false;
        ~~~~~~~

node_modules/@types/prettier/index.d.ts:53:65 - error TS2574: A rest element type must be an array type.

53 type IsTuple<T> = T extends [] ? true : T extends [infer First, ...infer Remain] ? IsTuple<Remain> : false;
                                                                   ~~~~~~~~~~~~~~~

node_modules/@types/prettier/index.d.ts:53:84 - error TS2315: Type 'IsTuple' is not generic.

53 type IsTuple<T> = T extends [] ? true : T extends [infer First, ...infer Remain] ? IsTuple<Remain> : false;
                                                                                      ~~~~~~~~~~~~~~~

node_modules/@types/prettier/index.d.ts:96:5 - error TS2589: Type instantiation is excessively deep and possibly infinite.

96     call<
       ~~~~

node_modules/@types/prettier/index.d.ts:131:5 - error TS2589: Type instantiation is excessively deep and possibly infinite.

131     each<
        ~~~~

node_modules/@types/prettier/index.d.ts:165:5 - error TS2589: Type instantiation is excessively deep and possibly infinite.

165     map<
        ~~~


Found 7 errors.
```

jestが依存するprettierに問題があるらしい。
（参考：https://stackoverflow.com/questions/72222305/aws-cdk-2-0-init-app-fails-to-build-with-prettier-issues-which-is-from-jest-sna）

package-lock.jsonを見てみるとこんな感じ

```
    "node_modules/jest-snapshot": {
      "version": "26.6.2",
      "resolved": "https://registry.npmjs.org/jest-snapshot/-/jest-snapshot-26.6.2.tgz",
      "integrity": "sha512-OLhxz05EzUtsAmOMzuupt1lHYXCNib0ECyuZ/PZOx9TrZcC8vL0x+DUG3TL+GLX3yHG45e6YGjIm0XwDc3q3og==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.0.0",
        "@jest/types": "^26.6.2",
        "@types/babel__traverse": "^7.0.4",
        "@types/prettier": "^2.0.0",
        "chalk": "^4.0.0",
        "expect": "^26.6.2",
        "graceful-fs": "^4.2.4",
        "jest-diff": "^26.6.2",
        "jest-get-type": "^26.3.0",
        "jest-haste-map": "^26.6.2",
        "jest-matcher-utils": "^26.6.2",
        "jest-message-util": "^26.6.2",
        "jest-resolve": "^26.6.2",
        "natural-compare": "^1.4.0",
        "pretty-format": "^26.6.2",
        "semver": "^7.3.2"
      },
      "engines": {
        "node": ">= 10.14.2"
      }
    },
```

```
    "node_modules/@types/prettier": {
      "version": "2.6.3",
      "resolved": "https://registry.npmjs.org/@types/prettier/-/prettier-2.6.3.tgz",
      "integrity": "sha512-ymZk3LEC/fsut+/Q5qejp6R9O1rMxz3XaRHDV6kX8MrGAhOSPqVARbDi+EZvInBpw+BnCX3TD240byVkOfQsHg==",
      "dev": true
    },
```

というわけでStackOverflowに従い、devDependenciesを追加してみる

```
{
  "devDependencies": {
    "@types/prettier": "2.6.0"
  }
}
```