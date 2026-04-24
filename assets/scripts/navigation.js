export default class NavigationManager {
    /** @type {Element | null} */
    pagesHome;

    /** @type {Element | null} */
    pagesMap;

    /** @type {Element | null} */
    bntHomeFooter;

    constructor() {
        this.pagesHome = document.querySelector("#home-page");
        this.pagesMap = document.querySelector("#map-page");
        this.bntHomeFooter = document.querySelector("#bnt-home-footer");
    }

    /**
     * Pour nagiver vers une page
     * @param {"home" | "map"} pageName Le nom de la page vers laquelle naviguer
     */
    navigate(pageName) {
        this.pagesHome && pageName === "home" ? this.pagesHome.classList.remove("hidden") : this.pagesHome?.classList.add("hidden");
        this.pagesMap && pageName === "map" ? this.pagesMap.classList.remove("hidden") : this.pagesMap?.classList.add("hidden");

        // change l'état du bouton home dans le footer
        pageName === "home" ? this.bntHomeFooter?.classList.add("active") : this.bntHomeFooter?.classList.remove("active");
    }
}