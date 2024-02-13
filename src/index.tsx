import {
  ButtonItem,
  definePlugin,
  DialogButton,
  Menu,
  MenuItem,
  Navigation,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  showContextMenu,
  staticClasses,
} from "decky-frontend-lib";
import { VFC } from "react";
import { FaShip } from "react-icons/fa";

const Content: VFC<{ serverAPI: ServerAPI }> = ({serverAPI}) => {
  interface RGB {r: number, g: number, b: number};
  interface effectState {
    effect: number,
    speed: number,
    colour: RGB
  };
  const fetchState = async () => {
    const result = await serverAPI.callPluginMethod<{}, effectState>("get_menu_state", {});
    return result.success ? result.result : {
      effect: 0,
      speed: 0,
      colour: {r: 0, g: 0, b: 0}
    };
  };
  const compareRGB = (a: RGB, b: RGB) => {
    return a.r == b.r && a.g == b.g && a.b == b.b;
  };
  return (
    <PanelSection title="Effects">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={(e) =>
            fetchState().then(effect_state =>
            showContextMenu(
              <Menu label="Menu" cancelText="Cancel" onCancel={() => {}}>
                <MenuItem selected={effect_state.effect == 3} onSelected={() => {serverAPI!.callPluginMethod("change_effect", { "effect": 3 });}}>Breathing</MenuItem>
                <MenuItem selected={effect_state.effect == 4} onSelected={() => {serverAPI!.callPluginMethod("change_effect", { "effect": 4 });}}>Wave</MenuItem>
                <MenuItem selected={effect_state.effect == 6} onSelected={() => {serverAPI!.callPluginMethod("change_effect", { "effect": 6 });}}>Smooth</MenuItem>
                <MenuItem selected={effect_state.effect == 8} onSelected={() => {serverAPI!.callPluginMethod("change_effect", { "effect": 8 });}}>Race</MenuItem>
                <MenuItem selected={effect_state.effect == 10} onSelected={() => {serverAPI!.callPluginMethod("change_effect", { "effect": 10 });}}>Stack</MenuItem>
              </Menu>,
              e.currentTarget ?? window
            ))
          }
        >
          Lighting Effect
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={(e) =>
            fetchState().then(effect_state =>
            showContextMenu(
              <Menu label="Menu" cancelText="Cancel" onCancel={() => {}}>
                <MenuItem selected={effect_state.speed == 1} onSelected={() => {serverAPI!.callPluginMethod("change_speed", { "speed": 1 });}}>Normal</MenuItem>
                <MenuItem selected={effect_state.speed == 2} onSelected={() => {serverAPI!.callPluginMethod("change_speed", { "speed": 2 });}}>Medium</MenuItem>
                <MenuItem selected={effect_state.speed == 3} onSelected={() => {serverAPI!.callPluginMethod("change_speed", { "speed": 3 });}}>Fast</MenuItem>
                <MenuItem selected={effect_state.speed == 4} onSelected={() => {serverAPI!.callPluginMethod("change_speed", { "speed": 4 });}}>Turbo</MenuItem>
              </Menu>,
              e.currentTarget ?? window
            ))
          }
        >
          Effect Speed
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={(e) =>
            fetchState().then(effect_state =>
            showContextMenu(
              <Menu label="Menu" cancelText="Cancel" onCancel={() => {}}>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 255, g: 0, b: 0})} onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 255, "g": 0, "b": 0 });}}>Red</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 0, g: 255, b: 0})} onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 0, "g": 255, "b": 0 });}}>Green</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 0, g: 0, b: 255})} onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 0, "g": 0, "b": 255 });}}>Blue</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 255, g: 255, b: 0})} onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 255, "g": 255, "b": 0 });}}>Yellow</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 255, g: 0, b: 255})} onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 255, "g": 0, "b": 255 });}}>Purple</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 0, g: 255, b: 255})} onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 0, "g": 255, "b": 255 });}}>Teal</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 255, g: 255, b: 255})} onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 255, "g": 255, "b": 255 });}}>White</MenuItem>
              </Menu>,
              e.currentTarget ?? window
            ))
          }
        >
          Static Colour
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => {
            Navigation.Navigate("/decky-jsaux-about");
          }}
        >
          About
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
};

const DeckyPluginRouterTest: VFC = () => {
  return (
    <div style={{ marginTop: "50px", color: "white" }}>
      <h1>Decky JSAUX RGB.</h1>
      <p>An unofficial lighting effect controller plugin for the JSAUX RGB Dock.</p>
      <p>(Tested only on the HB1201S)</p>
      <p>Created by Phil @Gadgetoid Howard</p>
      <p>Issues, bugs and $$$ - <a onClick={() => Navigation.NavigateToExternalWeb("https://github.com/gadgetoid/decky-jsaux-rgb")}>https://github.com/gadgetoid/decky-jsaux-rgb</a></p>
      <DialogButton onClick={() => Navigation.NavigateBack()}>
        Close
      </DialogButton>
    </div>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  serverApi.routerHook.addRoute("/decky-jsaux-about", DeckyPluginRouterTest, {
    exact: true,
  });

  return {
    title: <div className={staticClasses.Title}>Decky JSAUX RGB</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaShip />,
    onDismount() {
      serverApi.routerHook.removeRoute("/decky-jsaux-about");
    },
  };
});
