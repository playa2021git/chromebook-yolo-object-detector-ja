# chromebook-yolo-object-detector-ja

ChromebookのWebカメラで動作する、サーバー不要・ブラウザ完結の日本語YOLO物体検出アプリです。

## スクリーンショット

公開後に `docs/screenshot.png` を追加し、ここへ掲載してください。

## デモURL

想定URL: https://playa2021git.github.io/chromebook-yolo-object-detector-ja/

## 主な機能

- 「カメラを開始」「カメラを停止」による明示的なカメラ制御
- 人物のみ / すべての物体モード
- 現在の人数を大きく表示
- COCOクラス名の日本語表示
- WebGPUを優先し、失敗時はWASM（CPU）へフォールバック
- Canvasによるバウンディングボックス描画

## 仕組み

カメラ映像をブラウザ内で `ImageBitmap` に変換し、Web Workerへ渡します。Worker内でONNX Runtime Webを使ってYOLO ONNXモデルを実行し、NMS後の検出結果をUIへ返します。UI側では検出モードで結果をフィルタリングし、Canvasへ日本語ラベルと信頼度を描画します。

## サーバー不要・プライバシー

専用バックエンド、推論API、外部AI APIは使用しません。カメラ映像と検出結果は外部サーバーへ送信・保存されません。詳しくは [PRIVACY.md](./PRIVACY.md) を参照してください。

## Chromebookでの使い方

1. ChromeでデモURLまたはローカル開発URLを開きます。
2. 「カメラを開始」を押します。
3. ブラウザのカメラ権限ダイアログで許可します。
4. 必要に応じてカメラ選択、検出モード、信頼度を調整します。
5. 終了時は「カメラを停止」を押します。

カメラはHTTPSまたはlocalhostでのみ利用できます。

## 動作環境

主対象はChromeOSの最新安定版Google Chromeです。Windows版Chrome、Edge、macOS版Chromeでも動作を想定しています。Safari/Firefoxの完全対応は保証しません。

## WebGPUとWASM

WebGPUでONNX Runtimeのセッション作成まで成功した場合はWebGPUで実行します。WebGPUが利用できない、または初期化に失敗した場合はWASM（CPU）へ自動的に切り替えます。

## モデル

デフォルトのモデルパスは `public/models/yolo11n.onnx` です。派生元コードを取得できなかったため、モデル本体はこの作業では同梱していません。公開前にライセンスを確認したYOLO Detect ONNXモデルを配置してください。存在しないモデル名を推測して同梱しないため、この制約を明記しています。

## 開発

```bash
yarn install
yarn dev
```

## ビルド

```bash
yarn build
```

## GitHub Pages公開

`.github/workflows/deploy.yml` はGitHub Pages公式Actionsを使います。リポジトリの Settings → Pages で Source を GitHub Actions に設定してください。Viteのbaseは `/chromebook-yolo-object-detector-ja/` です。

このリポジトリには現時点で lockfile がないため、デプロイワークフローは `npm install` で依存関係を解決してから `npm run build` を実行します。GitHub Pages の Source を `Deploy from a branch` にすると、Vite のビルド成果物ではなくソース側の `index.html` が配信される可能性があります。公開URLで画面が真っ白な場合は、Actions の `Deploy to GitHub Pages` が成功していることと、Pages Source が `GitHub Actions` になっていることを確認してください。ワークフロー内では、ビルド後の `dist/index.html` に GitHub Pages 用の assets パスが含まれることと、デプロイ後のURLがHTMLを返すことを検証します。

## 制約・既知の問題

- AI検出には誤検出・見逃しがあります。
- 防犯設備としての性能を保証するものではありません。
- 性別、年齢、本人確認、危険性判定、顔認証は行いません。
- Chromebook実機とGitHub Pages上でのカメラ確認は別途必要です。

## ライセンス

アプリ本体はMIT Licenseです。同梱または追加するYOLOモデルには別ライセンス（例: Ultralytics YOLOモデルのAGPL-3.0）が適用される場合があります。アプリ本体とモデルのライセンスは異なる可能性があるため、`THIRD_PARTY_NOTICES.md` とモデル付属ライセンスを確認してください。

## 派生元への謝辞

このプロジェクトは `nomi30701/yolo-multi-task-onnxruntime-web` を派生元として想定しています。ネットワーク制限により作業時点でコード取得はできませんでしたが、ONNX Runtime Web、Web Worker、CanvasでYOLO推論を行う構成を踏襲しています。
