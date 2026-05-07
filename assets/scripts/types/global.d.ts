/**
 * prototype de typage global pour la variable window
 */

import Application from "../main.js";
import MapManager from "../map.js";
import UIManager from "../ui.js";
import NavigationManager from "../navigation.js";
import HomePageManager from "../home.js";

declare global {
    interface Window {
        app: Application;
        mapManager: MapManager;
        uiManager: UIManager;
        navigationManager: NavigationManager;
        homePageManager: HomePageManager;
    }
}

export { };