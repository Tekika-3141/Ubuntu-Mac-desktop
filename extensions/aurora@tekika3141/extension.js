import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Search from 'resource:///org/gnome/shell/ui/search.js';
import * as ExtensionUtils from 'resource:///org/gnome/shell/misc/extensionUtils.js';

const Extension = ExtensionUtils.getCurrentExtension();
const SCHEMA = 'org.tekika3141.aurora';

const AuroraButton = GObject.registerClass(
class AuroraButton extends PanelMenu.Button {
    _init(settings) {
        super._init(0.0, 'Aurora menu');
        this._settings = settings;
        this.add_child(new St.Label({text: 'Aurora', style_class: 'aurora-brand'}));

        const item = new PopupMenu.PopupMenuItem('Open application launcher');
        item.connect('activate', () => this._openLauncher());
        this.menu.addMenuItem(item);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const settingsItem = new PopupMenu.PopupMenuItem('Aurora settings');
        settingsItem.connect('activate', () => {
            Gio.Subprocess.new(
                ['gnome-extensions', 'prefs', Extension.metadata.uuid],
                Gio.SubprocessFlags.NONE,
            );
        });
        this.menu.addMenuItem(settingsItem);
    }

    _openLauncher() {
        Main.overview.show();
        Main.overview.searchEntry.set_text('');
        Main.overview.searchEntry.grab_key_focus();
    }
});

const StatusButton = GObject.registerClass(
class StatusButton extends PanelMenu.Button {
    _init(settings) {
        super._init(0.0, 'Aurora controls');
        this._settings = settings;
        const box = new St.BoxLayout({style_class: 'aurora-status-box'});
        box.add_child(new St.Icon({icon_name: 'network-wireless-symbolic'}));
        box.add_child(new St.Icon({icon_name: 'audio-volume-high-symbolic'}));
        box.add_child(new St.Icon({icon_name: 'battery-full-symbolic'}));
        this.add_child(box);

        const darkMode = new PopupMenu.PopupSwitchMenuItem(
            'Dark appearance',
            this._settings.get_boolean('dark-mode'),
        );
        darkMode.connect('toggled', (_item, active) =>
            this._settings.set_boolean('dark-mode', active));
        this.menu.addMenuItem(darkMode);

        const workspace = new PopupMenu.PopupMenuItem('Show workspaces');
        workspace.connect('activate', () => Main.overview.show(2));
        this.menu.addMenuItem(workspace);
    }
});

const Dock = GObject.registerClass(
class Dock extends St.Widget {
    _init(settings) {
        super._init({
            layout_manager: new Clutter.BoxLayout({
                orientation: Clutter.Orientation.HORIZONTAL,
                spacing: 8,
            }),
            style_class: 'aurora-dock',
            reactive: true,
            x_expand: true,
        });
        this._settings = settings;
        this._signals = [];
        this._refresh();
        this._signals.push(
            this._settings.connect('changed::dock-apps', () => this._refresh()),
            this._settings.connect('changed::dock-icon-size', () => this._refresh()),
        );
        this._signals.push(
            Shell.AppSystem.get_default().connect('installed-changed', () => this._refresh()),
        );
    }

    _refresh() {
        this.destroy_all_children();
        const size = this._settings.get_int('dock-icon-size');
        let appIds = this._settings.get_strv('dock-apps');
        if (appIds.length === 0)
            appIds = ['org.gnome.Nautilus.desktop', 'org.gnome.Terminal.desktop'];

        for (const id of appIds) {
            const app = Shell.AppSystem.get_default().lookup_app(id);
            if (!app)
                continue;
            const button = new St.Button({
                style_class: 'aurora-dock-item',
                child: app.create_icon_texture(size),
                reactive: true,
                can_focus: true,
                tooltip_text: app.get_name(),
            });
            button.connect('clicked', () => app.activate());
            this.add_child(button);
        }

        const launcher = new St.Button({
            style_class: 'aurora-dock-item aurora-launcher-button',
            child: new St.Icon({icon_name: 'view-app-grid-symbolic', icon_size: size}),
            tooltip_text: 'Applications',
        });
        launcher.connect('clicked', () => Main.overview.show());
        this.add_child(launcher);
    }

    destroy() {
        for (const signal of this._signals)
            this._settings.disconnect(signal);
        super.destroy();
    }
});

const DockLayer = GObject.registerClass(
class DockLayer extends St.Widget {
    _init(settings) {
        super._init({
            layout_manager: new Clutter.BinLayout(),
            x_expand: true,
            y_expand: true,
            reactive: false,
        });
        this._dock = new Dock(settings);
        this.add_child(this._dock);
        this._dock.set_x_align(Clutter.ActorAlign.CENTER);
        this._dock.set_y_align(Clutter.ActorAlign.END);
        this._dock.set_margin_bottom(12);
    }
});

const AuroraSearchProvider = GObject.registerClass(
class AuroraSearchProvider extends Search.SearchProvider {
    _init() {
        super._init();
        this.id = 'aurora';
        this.appSystem = Shell.AppSystem.get_default();
    }

    getResultMetas(ids) {
        return ids.map(id => {
            const app = this.appSystem.lookup_app(id);
            return {
                id,
                name: app?.get_name() ?? id,
                description: 'Application',
                createIcon: size => app?.create_icon_texture(size),
            };
        });
    }

    getInitialResultSet(terms, _callback) {
        const query = terms.join(' ').toLowerCase();
        const apps = this.appSystem.get_running().concat(
            this.appSystem.get_installed().filter(app => !app.is_transient()),
        );
        const ids = [];
        for (const app of apps) {
            if (app.get_name().toLowerCase().includes(query))
                ids.push(app.get_id());
        }
        return ids.filter((id, index) => ids.indexOf(id) === index);
    }

    getSubsearchResultSet(previousResults, terms, _callback) {
        const query = terms.join(' ').toLowerCase();
        return previousResults.filter(id =>
            this.appSystem.lookup_app(id)?.get_name().toLowerCase().includes(query));
    }

    activateResult(id) {
        this.appSystem.lookup_app(id)?.activate();
    }
});

export default class AuroraExtension {
    enable() {
        this._settings = ExtensionUtils.getSettings(SCHEMA);
        this._loadStylesheet();
        this._panelItems = [
            [this._settings.get_string('panel-position'), new AuroraButton(this._settings)],
            ['right', new StatusButton(this._settings)],
        ];
        for (const [position, item] of this._panelItems)
            Main.panel.addToStatusArea(`aurora-${item.constructor.name}`, item, 1, position);

        this._dockLayer = new DockLayer(this._settings);
        Main.layoutManager.addChrome(this._dockLayer, {affectsStruts: false});
        this._dockLayer.set_position(0, 0);
        this._dockLayer.set_size(global.stage.width, global.stage.height);
        this._stageSignal = global.stage.connect('notify::size', () =>
            this._dockLayer.set_size(global.stage.width, global.stage.height));

        this._searchProvider = new AuroraSearchProvider();
        Main.overview.searchController.addProvider(this._searchProvider);
        this._settings.connect('changed::dark-mode', () => this._updateTheme());
        this._updateTheme();
    }

    _loadStylesheet() {
        this._stylesheetPath = Extension.dir.get_child('stylesheet.css').get_path();
        this._theme = St.ThemeContext.get_for_stage(global.stage).get_theme();
        this._theme.load_stylesheet(this._stylesheetPath);
    }

    _updateTheme() {
        global.stage.toggle_style_class_name(
            'aurora-dark',
            this._settings.get_boolean('dark-mode'),
        );
    }

    disable() {
        if (this._stageSignal)
            global.stage.disconnect(this._stageSignal);
        if (this._searchProvider)
            Main.overview.searchController.removeProvider(this._searchProvider);
        this._dockLayer?.destroy();
        for (const [, item] of this._panelItems ?? [])
            item.destroy();
        if (this._theme && this._stylesheetPath)
            this._theme.unload_stylesheet(this._stylesheetPath);
        global.stage.remove_style_class_name('aurora-dark');
        this._panelItems = [];
        this._settings = null;
    }
}
