import { escapeHtml } from "../utils/htmlUtils.js";
import Application from '../main.js';

/** @typedef {import('../types/Boat.js').Boat} Boat */
/** @typedef {import('../types/Channel.js').Channel} ChannelsType */


class HomePageManager {
  /** @type {Element | null} */
  channelListContainer;

  /** @type {Element | null} */
  bntBack;

  /** @type {Application} */
  app;

  /**
   * @param {Application} app - L'instance de l'application principale pour accéder aux données et méthodes globales
   */
  constructor(app) {
    this.app = app;
    this.channelListContainer = document.querySelector("#channel-list-container");

    // initalise le bouton de retour en arrière pour les sous section
    this.bntBack = document.querySelector("#home-page-bnt-back");

    this.bntBack.addEventListener("click", () => {
      this.hideBackButton();
      this.renderChannelList(window.app.channels.results);
    })

    // pour avoir un titre au chargement on affiche un titre qui sera écrasé ou pas par la suite
    this.setTitle("Cartographie des canaux");
  }

  /**
   * 
   * @param {ChannelsType[]} channels 
   */
  renderChannelList(channels) {
    this.hideBackButton();
    this.setTitle("Cartographie des canaux");

    // écrase un potentiel ancien contenu (ex: "Chargement...")
    this.channelListContainer.innerHTML = '';

    // Afficher chaque secteur_appli comme un canal à part entière
    channels.forEach(channel => {
      const channelCard = this.channelCardHTML(channel);

      // ajoute le listener pour allez sur la map
      const bntGoMap = channelCard.querySelector(".canal-card__button");

      bntGoMap.addEventListener("click", (e) => {
        window.uiManager.handleChangeCannel(channel, window.app.channels.results);
        window.app.handleChannelSelect(channel.id);
        window.navigationManager.navigate("map");
      });

      this.channelListContainer.appendChild(channelCard);
    });
  }

  /**
   * @param {ChannelsType} channel
   * @returns {HTMLDivElement}
   */
  channelCardHTML(channel) {
    const cardHTML = document.createElement("div");
    cardHTML.classList.add("canal-card");
    cardHTML.style.backgroundColor = this.getColorCardChannel(channel.voie_navigable);

    const title = channel.secteur_appli || channel.voie_navigable;

    /** @type {Object.<string, Boat[]>} */
    const listBoatsForChannel = window.app.allBoats[channel.voie_navigable] || [];

    const boatsForThisSection = listBoatsForChannel[channel.id] || [];

    const { montant, descendant } = boatsForThisSection.reduce((acc, boat) => {
      if (boat.sens === "Montant") {
        acc.montant += 1;
      } else if (boat.sens === "Descendant") {
        acc.descendant += 1;
      }
      return acc;
    }, { montant: 0, descendant: 0 });

    cardHTML.innerHTML = `
            <p class="canal-card__title">${escapeHtml(title)}</p>
            <div class="canal-card__footer">
                <div class="canal-card__status${(descendant === 0 && montant === 0) ? " canal-card__status--empty" : ""}">

                ${(descendant === 0 && montant === 0) ? `<p class="canal-card__status-text">Aucun bateau</p>` : `
                  ${descendant > 0 ? `
                    <div class="canal-card__metric">
                      <div class="canal-card__metric-badge">
                        <p class="canal-card__metric-badge-text" style="background-color: #AFCB56;">D</p>
                      </div>
                      <p class="canal-card__metric-text">${descendant} bateau${descendant > 1 ? "x" : ""}</p>
                    </div>` : ""}
                  ${montant > 0 ? `
                    <div class="canal-card__metric">
                      <div class="canal-card__metric-badge ">
                        <p class="canal-card__metric-badge-text" style="background-color: #F1B453;">M</p>
                      </div>
                      <p class="canal-card__metric-text">${montant} bateau${montant > 1 ? "x" : ""}</p>
                    </div>` : ""}
                  `}


                </div>
                <button class="canal-card__button">Accéder</button>
            </div>
        `;

    // ajoute un lesener pour ouvrir la modal de détail des bateux
    if (boatsForThisSection.length > 0) {
      const divStatus = cardHTML.querySelector(".canal-card__status");

      divStatus.addEventListener("click", (e) => {
        e.stopPropagation();
        window.navigationManager.openModal(boatsForThisSection, "nombreBoats");
      });
    }

    // retourne la card
    return cardHTML;
  }

  /**
   * 
   * @param {string} voie_navigable 
   */
  getColorCardChannel(voie_navigable) {
    switch (voie_navigable) {
      case "Blavet":
        return "#AFCB56";
      case "Canal d'Ille et Rance":
        return "#CC8CA8";
      case "Canal de Nantes à Brest":
        return "#A1B5DC";
      case "Vilaine":
        return "#CC8CA8";
      default:
        return "#AFCB56";
    }
  }

  /**
   * Change le titre de la page d'acceuil
   * @param {string} title - le titre a mettre sur la page d'acceuil
   * @returns rien
   */
  setTitle(title) {
    const titleElement = document.querySelector("#home-page-title");

    if (!titleElement) return;

    titleElement.textContent = title;
  }

  getBoatsForSectionChannel() { }

  /** Affiche le bouton retour au menu principal pour quitter les sous section */
  showBackButton() {
    this.bntBack.style.display = "flex";
  }

  /** Cache le bouton retour en arrère */
  hideBackButton() {
    this.bntBack.style.display = "none";
  }
}

export default HomePageManager;