import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import * as ExtensionUtils from 'resource:///org/gnome/shell/misc/extensionUtils.js';

const SettingsPage = GObject.registerClass(
class SettingsPage extends Adw.PreferencesPage {
    _init(settings) {
        super._init({title: 'Aurora', icon_name: 'preferences-desktop-theme-symbolic'});

        const appearance = new Adw.PreferencesGroup({title: 'Appearance'});
        const darkMode = new Adw.SwitchRow({
            title: 'Dark appearance',
            subtitle: 'Use Aurora dark colors for the panel and Dock.',
        });
        settings.bind('dark-mode', darkMode, 'active', Gio.SettingsBindFlags.DEFAULT);
        appearance.add(darkMode);
        this.add(appearance);

        const dock = new Adw.PreferencesGroup({title: 'Dock'});
        const iconSize = new Adw.SpinRow({
            title: 'Icon size',
            subtitle: 'The Dock icon size in pixels.',
            adjustment: new Gtk.Adjustment({
                lower: 24,
                upper: 96,
                step_increment: 4,
                value: settings.get_int('dock-icon-size'),
            }),
        });
        iconSize.connect('notify::value', () =>
            settings.set_int('dock-icon-size', iconSize.value));
        dock.add(iconSize);
        this.add(dock);
    }
});

export default class AuroraPreferences {
    fillPreferencesWindow(window) {
        const settings = ExtensionUtils.getSettings('org.tekika3141.aurora');
        window.search_enabled = false;
        window.add(new SettingsPage(settings));
    }
}
