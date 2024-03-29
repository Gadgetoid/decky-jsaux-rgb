import {
  ButtonItem,
  definePlugin,
  DialogButton,
  Field,
  Menu,
  MenuItem,
  Navigation,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  showContextMenu,
  staticClasses,
  Toggle,
} from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { FaThumbsDown, FaThumbsUp, FaUsb } from "react-icons/fa";

let lazy_update_timer: NodeJS.Timeout | undefined;

const Content: VFC<{ serverAPI: ServerAPI }> = ({serverAPI}) => {
  interface RGB {r: number, g: number, b: number};
  interface effectState {
    state: boolean,
    effect: number,
    speed: number,
    colour: RGB,
    connected: boolean
  };
  const [effect_state, set_effect_state] = useState<effectState>({
    state: false,
    effect: 0,
    speed: 0,
    colour: {r: 0, g: 0, b: 0},
    connected: false
  });
  const fetchState = async () => {
    const result = await serverAPI.callPluginMethod<{}, effectState>("get_menu_state", {});
    set_effect_state(result.success ? result.result : {
      state: false,
      effect: 0,
      speed: 0,
      colour: {r: 0, g: 0, b: 0},
      connected: false
    });
  };
  const change_effect = (effect: number) => {
    serverAPI!.callPluginMethod("change_effect", { "effect": effect });
  }
  const change_speed = (speed: number) => {
    serverAPI!.callPluginMethod("change_speed", { "speed": speed });
  }
  const change_colour = (r: number, g: number, b: number) => {
    serverAPI!.callPluginMethod("change_colour", { "r": r, "g": g, "b": b });
  }
  const effect_name = (effect: number) => {
    switch (effect) {
      case 1:
        return "Static"
      case 3:
        return "Breathing";
      case 4:
        return "Wave";
      case 6:
        return "Smooth";
      case 8:
        return "Race";
      case 10:
        return "Stack";
      default:
        return "Unknown"
    }
  };
  const speed_name = (speed: number) => {
    switch (speed) {
      case 1:
        return "Normal";
      case 2:
        return "Medium";
      case 3:
        return "Fast";
      case 4:
        return "Turbo";
      default:
        return "Unknown";
    }
  }
  const colour_name = (colour: RGB) => {
    // TODO: This is absolute lunacy
    if (compareRGB(colour, {r: 255, g: 0, b: 0})) {
      return "Red";
    }
    if (compareRGB(colour, {r: 0, g: 255, b: 0})) {
      return "Green";
    }
    if (compareRGB(colour, {r: 0, g: 0, b: 255})) {
      return "Blue";
    }
    if (compareRGB(colour, {r: 255, g: 255, b: 0})) {
      return "Yellow";
    }
    if (compareRGB(colour, {r: 255, g: 0, b: 255})) {
      return "Purple";
    }
    if (compareRGB(colour, {r: 0, g: 255, b: 255})) {
      return "Teal";
    }
    if (compareRGB(colour, {r: 255, g: 255, b: 255})) {
      return "White";
    }

    return "Unknown";
  }
  const compareRGB = (a: RGB, b: RGB) => {
    return a.r == b.r && a.g == b.g && a.b == b.b;
  };
	useEffect(() => {
    fetchState();
    // Lazy update to catch dock connection status
    // TODO: Could websockets push connection state to the frontend?
    if (lazy_update_timer) {
      console.log("Clearing interval...");
      clearInterval(lazy_update_timer);
    }
    lazy_update_timer = setInterval(async () => {
      fetchState();
    }, 2000);
    return () => {
      if (lazy_update_timer) {
        console.log("Clearing interval...");
        clearInterval(lazy_update_timer);
      }
    };
	}, []);
  return (
    <div>
    <PanelSection title="Status">
      <PanelSectionRow>
        <ButtonItem disabled
          layout="below">
          {effect_state.connected ? "Connected" : "Disconnected"}
          {effect_state.connected 
          ? <FaThumbsUp style={{marginLeft: "10px"}} title="Connected"></FaThumbsUp>
          : <FaThumbsDown style={{marginLeft: "10px"}} title="Disconnected"></FaThumbsDown>}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <Field label="Enable">
          <Toggle
            value={effect_state.state}
            onChange={() => {
              effect_state.state = !effect_state.state;
              serverAPI!.callPluginMethod("change_state", { "state": effect_state.state });
            }}/>
        </Field>
      </PanelSectionRow>
    </PanelSection>
    <PanelSection title="Lighting Effect">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={(e) =>
            fetchState().then(() =>
            showContextMenu(
              <Menu label="Effect Type" cancelText="Cancel" onCancel={() => {}}>
                <MenuItem selected={effect_state.effect == 1} onSelected={() => change_effect(1)}>Static</MenuItem>
                <MenuItem selected={effect_state.effect == 3} onSelected={() => change_effect(3)}>Breathing</MenuItem>
                <MenuItem selected={effect_state.effect == 4} onSelected={() => change_effect(4)}>Wave</MenuItem>
                <MenuItem selected={effect_state.effect == 6} onSelected={() => change_effect(6)}>Smooth</MenuItem>
                <MenuItem selected={effect_state.effect == 8} onSelected={() => change_effect(8)}>Race</MenuItem>
                <MenuItem selected={effect_state.effect == 10} onSelected={() => change_effect(10)}>Stack</MenuItem>
              </Menu>,
              e.currentTarget ?? window
            ))
          }
        >
          {effect_name(effect_state.effect)}
        </ButtonItem>
      </PanelSectionRow>
      {effect_state.effect != 1 && <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={(e) =>
            fetchState().then(() =>
            showContextMenu(
              <Menu label="Effect Speed" cancelText="Cancel" onCancel={() => {}}>
                <MenuItem selected={effect_state.speed == 1} onSelected={() => change_speed(1)}>Normal</MenuItem>
                <MenuItem selected={effect_state.speed == 2} onSelected={() => change_speed(2)}>Medium</MenuItem>
                <MenuItem selected={effect_state.speed == 3} onSelected={() => change_speed(3)}>Fast</MenuItem>
                <MenuItem selected={effect_state.speed == 4} onSelected={() => change_speed(4)}>Turbo</MenuItem>
              </Menu>,
              e.currentTarget ?? window
            ))
          }
        >
          {speed_name(effect_state.speed)}
        </ButtonItem>
      </PanelSectionRow>}
      {effect_state.effect == 1 && <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={(e) =>
            fetchState().then(() =>
            showContextMenu(
              <Menu label="Colour" cancelText="Cancel" onCancel={() => {}}>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 255, g: 0, b: 0})} onSelected={() => change_colour(255, 0, 0)}>Red</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 0, g: 255, b: 0})} onSelected={() => change_colour(0, 255, 0)}>Green</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 0, g: 0, b: 255})} onSelected={() => change_colour(0, 0, 255)}>Blue</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 255, g: 255, b: 0})} onSelected={() => change_colour(255, 255, 0)}>Yellow</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 255, g: 0, b: 255})} onSelected={() => change_colour(255, 0, 255)}>Purple</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 0, g: 255, b: 255})} onSelected={() => change_colour(0, 255, 255)}>Teal</MenuItem>
                <MenuItem selected={compareRGB(effect_state.colour, {r: 255, g: 255, b: 255})} onSelected={() => change_colour(255, 255, 255)}>White</MenuItem>
              </Menu>,
              e.currentTarget ?? window
            ))
          }
        >
          {colour_name(effect_state.colour)}
        </ButtonItem>
      </PanelSectionRow>}
    </PanelSection>
    <PanelSection title="Settings">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => {
            Navigation.CloseSideMenus();
            Navigation.Navigate("/decky-jsaux-about");
          }}
        >
          About
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
    </div>
  );
};

const DeckyPluginRouterTest: VFC = () => {
  return (
    <div style={{ marginTop: "50px", marginLeft: "50px", marginRight: "50px", color: "white" }}>
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
    icon: <FaUsb />,
    onDismount() {
      serverApi.routerHook.removeRoute("/decky-jsaux-about");
      if (lazy_update_timer) {
        clearInterval(lazy_update_timer);
      }
    },
  };
});
