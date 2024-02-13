import os
from subprocess import Popen

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin
import sys
import asyncio
import functools


class RGBDock:
    """JSAUX RGB Dock"""
    USB_VID = 0x306f
    USB_PID = 0x1234

    EFFECT_STATIC = 1
    EFFECT_BREATHING = 3
    EFFECT_WAVE = 4
    EFFECT_SMOOTH = 6
    EFFECT_RACE = 8
    EFFECT_STACK = 10

    def __init__(self):
        global usb, pyudev
        # 0x01 = effect (1 static, 3 breathing, 4 wave, 6 smooth, 8 race, 10 stack)
        # 0x02 = speed (1, 2, 3, or 4)
        # 0x03 = brightness (1 or 2)
        # 0x04 = RGB1
        # 0x07 = RGB2
        # 0x0A = RGB3
        # 0x0D = RGB4
        # 0x11 = wave LTR
        # 0x12 = wave RTL
        dep_path = os.path.join(decky_plugin.DECKY_PLUGIN_DIR, "bin")
        sys.path.insert(0, dep_path)
        import usb
        import pyudev
        sys.path.remove(dep_path)

        self._buf = [0 for _ in range(65)]
        self._buf[0x00] = 0x16  # Magic number? Header?

        # Store raw RGB values for brightness scaling later
        self._rgb = [[0, 0, 0] for _ in range(4)]

        self._effect = self.EFFECT_STATIC
        self._speed = 1
        self._brightness = 1.0
        self._needs_update = False

        self.connect() # (Try to) connect to the dock

         # Start udev monitoring
        self._udev_monitor = pyudev.Monitor.from_netlink(pyudev.Context())
        self._udev_monitor.filter_by(subsystem="usb")

        self.change_colour(255, 0, 0)

    def set_rgb(self, led, r, g, b):
        offset = led * 3
        self._rgb[offset:offset + 3] = [int(r), int(g), int(b)]
        self._needs_update = True

    def get_rgb(self, led):
        offset = led * 3
        return self._rgb[offset:offset + 3]

    def change_colour(self, r, g, b):
        for i in range(4):
            self.set_rgb(i, r, g, b)

    def change_effect(self, effect):
        self._effect = effect
        self._needs_update = True

    def change_brightness(self, brightness):
        self._brightness = brightness
        self._needs_update = True

    def change_speed(self, speed):
        self._speed = speed
        self._needs_update = True

    def connect(self):
        self._dev = usb.core.find(idVendor=self.USB_VID, idProduct=self.USB_PID)
        if self._dev:
            self._dev.set_configuration()
            decky_plugin.logger.info(f"Device connected: {self.USB_VID:04x} {self.USB_PID:04x}")
        else:
            decky_plugin.logger.info(f"Connection failed: {self.USB_VID:04x} {self.USB_PID:04x}")

    def disconnect(self):
        self._dev = None
        decky_plugin.logger.info(f"Device disconnected: {self.USB_VID:04x} {self.USB_PID:04x}")

    def process_udev_events(self):
        for device in iter(functools.partial(self._udev_monitor.poll, 0.01), None):
            vid = device.get("ID_VENDOR_ID")
            pid = device.get("ID_MODEL_ID")
            decky_plugin.logger.info(f"UDEV event: {vid} {pid} {device.action}")
            if vid == f"{RGBDock.USB_VID:04x}" and pid == f"{RGBDock.USB_PID:04x}":
                if device.action == "bind":
                    self.connect()
                    self._needs_update = True

    def update(self, force=False):
        self.process_udev_events()

        # Constantly re-setting things like the "breathing" effect will
        # restart the effect over and over, so we should only do high
        # frequency updates when running manual static colour effects
        if force:
            self._needs_update = True

        if not self._needs_update:
            return

        self._buf[0x01] = self._effect
        self._buf[0x02] = self._speed
        self._buf[0x03] = 2
        self._buf[0x04:0x04 + 12] = [int(c * self._brightness) for c in self._rgb]

        # Find the USB device
        # TODO: This wont be great for high-frequency updates

        # If found, send the update
        if self._dev:
            decky_plugin.logger.info("Updating dock...")
            try:
                self._dev.ctrl_transfer(0x21, 9, 0x200, 0, self._buf)
                self._needs_update = False
            except usb.core.USBError:
                self.disconnect()

    def __del__(self):
        self.change_colour(0, 0, 0)
        self.change_effect(self.EFFECT_STATIC)
        self.update()


class Plugin:
    async def get_menu_state(self):
        return {
            'effect': self._rgb_dock._effect,
            'speed': self._rgb_dock._speed,
            'colour': {
                'r': self._rgb_dock._rgb[0][0],
                'g': self._rgb_dock._rgb[0][1],
                'b': self._rgb_dock._rgb[0][2]
            }
        }

    async def change_effect(self, effect):
        self._rgb_dock.change_effect(effect)

    async def change_brightness(self, brightness):
        self._rgb_dock.change_brightness(brightness)

    async def change_speed(self, speed):
        self._rgb_dock.change_speed(speed)

    async def change_colour(self, r, g, b):
        self._rgb_dock.change_colour(r, g, b)
        self._rgb_dock.change_effect(RGBDock.EFFECT_STATIC)

    async def _main(self):
        self._rgb_dock = RGBDock()

        while True:
            self._rgb_dock.update()
            await asyncio.sleep(0.1)  # TODO: Make faster if we want to sequence custom effects

    async def _unload(self):
        pass

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
        decky_plugin.logger.info("Migrating")
        # Here's a migration example for logs:
        # - `~/.config/decky-jsaux-rgbtemplate.log` will be migrated to `decky_plugin.DECKY_PLUGIN_LOG_DIR/template.log`
        decky_plugin.migrate_logs(os.path.join(decky_plugin.DECKY_USER_HOME,
                                               ".config", "decky-jsaux-rgb", "template.log"))
        # Here's a migration example for settings:
        # - `~/homebrew/settings/template.json` is migrated to `decky_plugin.DECKY_PLUGIN_SETTINGS_DIR/template.json`
        # - `~/.config/decky-jsaux-rgb/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_SETTINGS_DIR/`
        decky_plugin.migrate_settings(
            os.path.join(decky_plugin.DECKY_HOME, "settings", "template.json"),
            os.path.join(decky_plugin.DECKY_USER_HOME, ".config", "decky-jsaux-rgb"))
        # Here's a migration example for runtime data:
        # - `~/homebrew/template/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_RUNTIME_DIR/`
        # - `~/.local/share/decky-jsaux-rgb/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_RUNTIME_DIR/`
        decky_plugin.migrate_runtime(
            os.path.join(decky_plugin.DECKY_HOME, "template"),
            os.path.join(decky_plugin.DECKY_USER_HOME, ".local", "share", "decky-jsaux-rgb"))
