/**
 * prototype de typage global pour la variable window
 */

import Application from "../main.js";
import MapManager from "../managers/map.js";
import UIManager from "../managers/ui.js";
import NavigationManager from "../managers/navigation.js";
import HomePageManager from "../managers/home.js";

declare global {
    interface Window {
        /** @deprecated - a progressivenement remplacer par this.app */
        app: Application;
        /**@deprecated - a progressivement remplacer par this.app.mapManager */
        mapManager: MapManager;
        /**@deprecated - a progressivement remplacer par this.app.uiManager */
        uiManager: UIManager;
        /**@deprecated - a progressivement remplacer par this.app.navigationManager */
        navigationManager: NavigationManager;
        /**@deprecated - a progressivement remplacer par this.app.homePageManager */
        homePageManager: HomePageManager;
    }
}

export { };