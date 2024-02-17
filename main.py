import os
import sys
import asyncio
import functools

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin
from settings import SettingsManager


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

    def __init__(self, effect=EFFECT_STATIC, speed=1, brightness=1.0, colour={"r": 0, "g": 255, "b": 255}, **kwargs):
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
        r = colour.get("r", 0)
        g = colour.get("g", 0)
        b = colour.get("b", 0)
        self._rgb = [[r, g, b] for _ in range(4)]

        self._state = True
        self._effect = effect
        self._speed = speed
        self._brightness = brightness
        self._needs_update = True

        self.connect() # (Try to) connect to the dock

         # Start udev monitoring
        self._udev_monitor = pyudev.Monitor.from_netlink(pyudev.Context())
        self._udev_monitor.filter_by(subsystem="usb")

    def set_rgb(self, led, r, g, b):
        self._rgb[led] = [int(r), int(g), int(b)]
        self._needs_update = True

    def get_rgb(self, led):
        return self._rgb[led]

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

    def is_connected(self):
        if self._dev is not None:
            try:
                self._dev.ctrl_transfer(0x21, 9, 0x200, 0, [])
                return True
            except usb.core.USBError:
                pass
        return False

    def process_udev_events(self):
        for device in iter(functools.partial(self._udev_monitor.poll, 0), None):
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
            return False

        self._buf[0x01] = self._effect if self._state else self.EFFECT_STATIC
        self._buf[0x02] = self._speed
        self._buf[0x03] = 2
        for i in range(4):  # TODO: this can probably be tidier
            offset = 0x04 + (i * 3)
            self._buf[offset:offset + 3] = [int(c * self._brightness) for c in self._rgb[i]] if self._state else [0, 0, 0]

        # Find the USB device
        # TODO: This wont be great for high-frequency updates

        # If found, send the update
        if self._dev:
            decky_plugin.logger.info("Updating dock...")
            try:
                self._dev.ctrl_transfer(0x21, 9, 0x200, 0, self._buf)
                self._needs_update = False
                return True
            except usb.core.USBError:
                self.disconnect()

        return False
    
    def get_state(self):
        return {
            'state': self._state,
            'effect': self._effect,
            'speed': self._speed,
            'colour': {
                'r': self._rgb[0][0],
                'g': self._rgb[0][1],
                'b': self._rgb[0][2]
            }
        }

    def change_state(self, state):
        self._state = state
        self._needs_update = True

    def __del__(self):
        self.change_colour(0, 0, 0)
        self.change_effect(self.EFFECT_STATIC)
        self.update()


class Plugin:
    async def change_state(self, state):
        self._rgb_dock.change_state(state)

    async def get_menu_state(self):
        state = self._rgb_dock.get_state()
        state["connected"] = self._rgb_dock.is_connected()
        return state

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
        self._settings = SettingsManager(name="settings", settings_directory=os.environ["DECKY_PLUGIN_SETTINGS_DIR"])
        self._settings.read()

        # Apply defaults
        # TODO: Why does this feel backwards!?
        self._settings.settings = {
            "effect": RGBDock.EFFECT_STATIC,
            "speed": 1,
            "brightness": 1.0,
            "colour": {"r": 0, "g": 255, "b": 255}
        } | self._settings.settings

        self._rgb_dock = RGBDock(**self._settings.settings)

        while True:
            if self._rgb_dock.update():  # If we have updated
                # Skip to updating the internal dict so we can commit once
                self._settings.settings.update(self._rgb_dock.get_state())
                self._settings.commit()
            await asyncio.sleep(0.1)  # TODO: Make faster if we want to sequence custom effects

    async def _unload(self):
        pass

    async def _migration(self):
        pass
