# Aurora Desktop

Ubuntu/GNOME上で動作する、macOSの操作思想を参考にした独自デスクトップ環境です。Appleのコード、商標、専用素材は使用していません。

現在のリポジトリは、Ubuntu/GNOME実機がない段階でも開発できるPhase 1〜3の基盤です。

## 構成

- `extensions/aurora@tekika3141/extension.js`: メニューバー、Dock、アプリランチャー、コントロールセンター、検索
- `extensions/aurora@tekika3141/prefs.js`: Aurora専用設定画面（ライト/ダーク、Dockサイズ）
- `extensions/aurora@tekika3141/stylesheet.css`: Aurora専用の見た目
- `extensions/aurora@tekika3141/schemas/`: `gsettings`で保存するユーザー設定
- `session/aurora.desktop`: ログイン画面から選択するGNOMEセッション
- `scripts/install.sh`: 依存関係の確認、Extension/設定/セッションの配置
- `scripts/uninstall.sh`: Auroraだけを削除し、標準Ubuntu環境を変更しない

## Ubuntuでの導入

Ubuntu GNOME上で、リポジトリのルートから次を実行します。

```bash
bash ./scripts/install.sh
```

インストール後に一度ログアウトし、ログイン画面のセッション選択から **Aurora Desktop** を選びます。通常のUbuntuへ戻るときは **Ubuntu** セッションを選んでください。

実機で初めて検証するときは、次も確認します。

```bash
gnome-shell --version
echo "$XDG_SESSION_TYPE"
gsettings list-schemas | grep org.gnome.shell
```

GNOME Shellのメジャーバージョンが異なる場合は、`metadata.json` の `shell-version` とAPI互換性を確認してください。Waylandでは他アプリのウィンドウを任意に移動するAPIが制限されるため、ウィンドウ操作はGNOMEの標準機能を尊重します。

## 開発者向け確認

GNOME実機でExtensionを一時的に有効化するには、次を実行します。

```bash
gnome-extensions enable aurora@tekika3141
gnome-extensions info aurora@tekika3141
journalctl --user -f -o cat /usr/bin/gnome-shell
```

削除する場合は次を実行します。

```bash
bash ./scripts/uninstall.sh
```

コードを変更したら、GNOME ShellのExtensionを再読み込みしてください。WaylandではShell全体の再起動ができないため、ログアウト/ログインで確実に反映します。

## 設計方針

- GNOME Shellの公開APIだけを使い、Waylandの制限を回避するための非公開API依存を避ける
- 標準アプリケーションの`.desktop`情報を`Gio.DesktopAppInfo`経由で利用する
- 設定は`~/.config`へ直接書き込まず、GSettingsのユーザー設定へ保存する
- Ubuntu標準セッションを上書きせず、Aurora専用のセッション登録だけを行う
- UIは独自の色・名前・レイアウトを使い、既存製品の素材を同梱しない
