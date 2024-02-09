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

// interface AddMethodArgs {
//   left: number;
//   right: number;
// }

const Content: VFC<{ serverAPI: ServerAPI }> = ({serverAPI}) => {
  // const [result, setResult] = useState<number | undefined>();

  // const onClick = async () => {
  //   const result = await serverAPI.callPluginMethod<AddMethodArgs, number>(
  //     "add",
  //     {
  //       left: 2,
  //       right: 2,
  //     }
  //   );
  //   if (result.success) {
  //     setResult(result.result);
  //   }
  // };

  return (
    <PanelSection title="Controls">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={(e) =>
            showContextMenu(
              <Menu label="Menu" cancelText="Cancel" onCancel={() => {}}>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_effect", { "effect": 3 });}}>Breathing</MenuItem>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_effect", { "effect": 4 });}}>Wave</MenuItem>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_effect", { "effect": 6 });}}>Smooth</MenuItem>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_effect", { "effect": 8 });}}>Race</MenuItem>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_effect", { "effect": 10 });}}>Stack</MenuItem>
              </Menu>,
              e.currentTarget ?? window
            )
          }
        >
          RGB Effect
        </ButtonItem>
      </PanelSectionRow>
      
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={(e) =>
            showContextMenu(
              <Menu label="Menu" cancelText="Cancel" onCancel={() => {}}>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 255, "g": 0, "b": 0 });}}>Red</MenuItem>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 0, "g": 255, "b": 0 });}}>Green</MenuItem>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 0, "g": 0, "b": 255 });}}>Blue</MenuItem>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 255, "g": 255, "b": 0 });}}>Yellow</MenuItem>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 255, "g": 0, "b": 255 });}}>Purple</MenuItem>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 0, "g": 255, "b": 255 });}}>Teal</MenuItem>
                <MenuItem onSelected={() => {serverAPI!.callPluginMethod("change_colour", { "r": 255, "g": 255, "b": 255 });}}>White</MenuItem>
              </Menu>,
              e.currentTarget ?? window
            )
          }
        >
          Static Colour
        </ButtonItem>
      </PanelSectionRow>

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
