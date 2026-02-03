# dog-corner 🐶

Chromeの画面右下に、愛犬の写真をそっと表示する拡張機能です。  
作業中でも目に入るたびに、ちょっと元気が出ます。

## Features
- ブラウザ右下に画像を固定表示
- 画像は角に馴染むようにサイズ調整
- シンプルで軽量（余計なUIなし）

## Installation (Local) 
[Qiitaにて記事](https://qiita.com/a_kawasaki/items/e4810bb079c6bc4efcab)でも導入方法を書いています。

1. このリポジトリをダウンロード（または `git clone`）
2. Chromeで `chrome://extensions/` を開く
3. 右上の「デベロッパーモード」をON
4. 「パッケージ化されていない拡張機能を読み込む」
5. `dog-corner` フォルダを選択

## Files
- `manifest.json` : 拡張機能の設定
- `content.js` : 画像をページに挿入
- `popup.html / popup.js` : ポップアップUI（ある場合）
- `icons/` : アイコン

## Notes
- `.DS_Store` は `.gitignore` で除外しています（Mac対策）
- 必要に応じて表示位置やサイズは `content.js` で調整できます

## Author
Ayaka
